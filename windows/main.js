const { app, BrowserWindow, Tray, Menu, clipboard, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

let mainWindow = null;
let tray = null;
let lastClipboardText = '';
let lastSyncedHash = '';

// Configuration store
const config = {
  serverUrl: 'https://your-sync-server.applet.run',
  encryptionPassphrase: 'SyncClipDefaultKey2026',
  autoSync: true,
  networkFilterEnabled: true,
  allowedNetworks: ['Home_5G_AC', 'Office_Secure_WiFi', 'Corporate_LAN'],
  maxHistory: 5,
  autoStartOnBoot: true
};

// Check connected Wi-Fi SSID on Windows using 'netsh wlan show interfaces'
function getConnectedSSID() {
  try {
    const stdout = execSync('chcp 65001 > nul && netsh wlan show interfaces', { encoding: 'utf8' });
    const match = stdout.match(/^\s*SSID\s*:\s*(.+)$/m);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (err) {
    // If ethernet or command fails, fallback
  }
  return 'Wired_Ethernet';
}

// AES-256-GCM Encryption compatible with Web Crypto API
function encryptPayload(text, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([encrypted, tag]);
  const hash = crypto.createHash('sha256').update(text).digest('hex');

  return {
    encryptedPayload: combined.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    hash
  };
}

// Setup Windows Boot Auto-Start via Electron loginItemSettings
function configureAutoStart(enable) {
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: true,
    name: 'SyncClip Windows Clipboard'
  });
}

// Background Clipboard Poller
function startClipboardPoller() {
  setInterval(async () => {
    if (!config.autoSync) return;

    try {
      const currentText = clipboard.readText();
      if (!currentText || currentText === lastClipboardText) return;
      lastClipboardText = currentText;

      // Check network whitelist
      const currentSSID = getConnectedSSID();
      if (config.networkFilterEnabled && !config.allowedNetworks.includes(currentSSID)) {
        console.log(`Sync skipped: Current network ${currentSSID} is not in designated list.`);
        return;
      }

      // Encrypt and Push
      const encrypted = encryptPayload(currentText, config.encryptionPassphrase);
      if (encrypted.hash === lastSyncedHash) return;
      lastSyncedHash = encrypted.hash;

      const payload = {
        id: 'clip_' + Date.now(),
        encryptedPayload: encrypted.encryptedPayload,
        iv: encrypted.iv,
        salt: encrypted.salt,
        hash: encrypted.hash,
        device: {
          id: 'WIN_' + process.env.COMPUTERNAME,
          name: 'Windows PC (' + (process.env.COMPUTERNAME || 'DESKTOP') + ')',
          type: 'windows',
          networkName: currentSSID
        },
        timestamp: Date.now()
      };

      const fetch = (await import('node-fetch')).default;
      await fetch(`${config.serverUrl}/api/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Synchronized clipboard securely over network:', currentSSID);
    } catch (err) {
      console.error('Clipboard sync error:', err.message);
    }
  }, 1000);
}

// Create Electron Tray and Background Window
app.whenReady().then(() => {
  configureAutoStart(config.autoStartOnBoot);

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Start minimized to tray
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(config.serverUrl);

  // System Tray configuration
  const iconPath = path.join(__dirname, 'icon.ico');
  const trayIcon = fs.existsSync(iconPath) ? iconPath : require('electron').nativeImage.createEmpty();
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'SyncClip を開く', click: () => mainWindow.show() },
    { label: '自動同期: ' + (config.autoSync ? '有効' : '無効'), click: () => {
      config.autoSync = !config.autoSync;
    }},
    { type: 'separator' },
    { label: '終了', click: () => app.quit() }
  ]);

  tray.setToolTip('SyncClip - 暗号化クリップボード同期');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  startClipboardPoller();
});
