const { app, BrowserWindow, Tray, Menu, clipboard, ipcMain, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ==========================================
// 1. Single Instance Lock (多重起動の完全抑止)
// ==========================================
// ポチポチ何回クリックされても1プロセスのみ起動。2個目以降は既存を前面表示して即時終了。
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let tray = null;
let isQuitting = false;
let lastClipboardText = '';
let lastSyncedHash = '';

// Configuration store
const config = {
  serverUrl: 'https://your-sync-server.applet.run',
  encryptionPassphrase: 'SyncClipDefaultKey2026',
  autoSync: true,
  networkFilterEnabled: true,
  // 最大10件まで登録可能な指定ネットワーク
  allowedNetworks: ['Home_5G_AC', 'Office_Secure_WiFi', 'Corporate_LAN'],
  maxHistory: 5,
  autoStartOnBoot: true
};

// 鮮明なエメラルドグリーン (#056D3B) と白のクリップボードアイコン (256x256 Base64 PNG)
const TRAY_ICON_PNG_BASE64 = 
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAEb0lEQVR42u3csY2FQBBEwXHIgkCQiIn8TTaFxRpNU0/qBJa5sr6u' +
  'SpIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkxXU892tmfQOAGQAAYAYAAJgBAABmAACAGQAAYAYAAJgBAABmAACAGQAAYAYAAJgBAABmAACAGQAAYAYAAJgBAABmAACAGQAAYAYAH8AMAGYGADMDgJkB' +
  'wMwAYGYAsK8f9jpj5nsCwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAAADAAAAAABgAAAAAAwAAAGAAAAAADAAAAIA7AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGyv' +
  'syQAOgMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAkwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/PUAAAAAEAAA' +
  'AAABAAAAEAAAAAABAAAAEAAAAAABAAAAEAAAAAABAAAAEAAAAAABAAAAEAAAAAABAAAAEAAAAAABAAAAEAAAAAABAAAAEAAAAAABAAAAEAAAAAABAAAAEAAAMBqA9Dfz3gBwkADw3gBwkADw3gBw' +
  'kADw3gBwkADw3gBwkP7QvTcAHKR5bwA4SPPeAHCQ5r0B4CAB4L0B4KfAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAHKT3BgAAHKT3BgAAHKT3BgAAHKT3BoCDdJDeGwAO0kF6bwA4SAB4bwA4SAB4bwA4SAB4bwA4SAB4bwA4SPkpMAAAIAAAAAACAAAAIAAAAA' +
  'ACAAAAIAAAAAACAAAAIAAAAAACAAAAIAAAAAACAAAAIAAAAAACAAAAIAAAAAACAAAAIAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAwD+p/A2GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAICDBAAAAOAgAQAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAAAAgAAACAAAAA' +
  'AAgAAACAAAAAAAgAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADADAADMAAAAMwAAwAwAADADgA9gBgAzA4CZAcDMAGBmADAzAJgZAMwMAGYG' +
  'ADMDgJkBwMwAYGYAMDMAmBkAzAwAZgYAMwOAGQAAYAYAAJgBAABmAACAGQAAYAYAAJgBAABmAJAkSZIkSZIkSZIkSZIkSZIkSZIkSZI0oAWKAaTPOhkeSAAAAABJRU5ErkJggg==';

function getTrayIcon() {
  const iconPath = path.join(__dirname, 'icon.png');
  if (fs.existsSync(iconPath)) {
    try {
      const img = nativeImage.createFromPath(iconPath);
      if (!img.isEmpty()) return img;
    } catch (e) {
      // fallback
    }
  }
  return nativeImage.createFromDataURL(TRAY_ICON_PNG_BASE64);
}

// Windows Wi-Fi SSID 取得
function getConnectedSSID() {
  try {
    const stdout = execSync('chcp 65001 > nul && netsh wlan show interfaces', { encoding: 'utf8' });
    const match = stdout.match(/^\s*SSID\s*:\s*(.+)$/m);
    if (match && match[1]) {
      const ssid = match[1].trim();
      if (ssid && ssid !== '<unknown ssid>') return ssid;
    }
  } catch (err) {
    // LAN or Wi-Fi not connected
  }
  return 'Wired_Ethernet';
}

// AES-256-GCM 暗号化
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

// 起動時自動起動
function configureAutoStart(enable) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: true,
      name: 'SyncClip Windows Clipboard'
    });
  } catch (e) {
    console.error('Failed to set login item settings:', e);
  }
}

// クリップボードポーラー
function startClipboardPoller() {
  setInterval(async () => {
    if (!config.autoSync || isQuitting) return;

    try {
      const currentText = clipboard.readText();
      if (!currentText || currentText === lastClipboardText) return;
      lastClipboardText = currentText;

      // 指定ネットワーク制限チェック
      const currentSSID = getConnectedSSID();
      if (config.networkFilterEnabled && !config.allowedNetworks.includes(currentSSID)) {
        console.log(`Sync skipped: Current network ${currentSSID} is not in designated list.`);
        return;
      }

      // 暗号化して送信
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
          id: 'WIN_' + (process.env.COMPUTERNAME || 'PC'),
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

// 2重起動検知時：既存ウィンドウを前面化
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(() => {
  configureAutoStart(config.autoStartOnBoot);

  mainWindow = new BrowserWindow({
    width: 960,
    height: 700,
    show: false, // 起動時はタスクトレイ常駐
    icon: getTrayIcon(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(config.serverUrl);

  // ==========================================
  // 3. System Tray & Clean Exit Menu
  // ==========================================
  tray = new Tray(getTrayIcon());
  
  function updateContextMenu() {
    const currentSSID = getConnectedSSID();
    const isWhitelisted = config.allowedNetworks.includes(currentSSID);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'SyncClip を開く',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        }
      },
      { type: 'separator' },
      {
        label: `現在の接続: ${currentSSID} (${isWhitelisted ? '同期許可' : '未指定'})`,
        enabled: false
      },
      {
        label: `現在のWi-Fi「${currentSSID}」を指定ネットワークに追加`,
        enabled: !isWhitelisted && config.allowedNetworks.length < 10,
        click: () => {
          if (!config.allowedNetworks.includes(currentSSID)) {
            if (config.allowedNetworks.length >= 10) {
              dialog.showMessageBox({
                type: 'warning',
                title: '上限到達',
                message: '指定ネットワークは最大10件までです。'
              });
              return;
            }
            config.allowedNetworks.push(currentSSID);
            updateContextMenu();
            dialog.showMessageBox({
              type: 'info',
              title: '追加完了',
              message: `「${currentSSID}」を指定ネットワークリストに追加しました。`
            });
          }
        }
      },
      {
        label: `指定ネットワーク (${config.allowedNetworks.length}/10件)`,
        submenu: config.allowedNetworks.map((net) => ({
          label: `${net}${net === currentSSID ? ' (接続中)' : ''}`,
          enabled: false
        }))
      },
      { type: 'separator' },
      {
        label: '自動同期: ' + (config.autoSync ? '有効 [ON]' : '停止中 [OFF]'),
        type: 'checkbox',
        checked: config.autoSync,
        click: () => {
          config.autoSync = !config.autoSync;
          updateContextMenu();
        }
      },
      {
        label: '指定ネットワーク制限: ' + (config.networkFilterEnabled ? '有効 [ON]' : '全NW許可 [OFF]'),
        type: 'checkbox',
        checked: config.networkFilterEnabled,
        click: () => {
          config.networkFilterEnabled = !config.networkFilterEnabled;
          updateContextMenu();
        }
      },
      { type: 'separator' },
      {
        label: 'SyncClip を終了する (完全に終了)',
        click: () => {
          // 終了フラグを立ててトレイアイコンとウィンドウを直ちに破棄
          isQuitting = true;
          if (tray) {
            tray.destroy();
            tray = null;
          }
          if (mainWindow) {
            mainWindow.destroy();
            mainWindow = null;
          }
          app.quit();
          process.exit(0);
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip(`SyncClip - 暗号化クリップボード同期 (接続: ${currentSSID})`);
  }

  updateContextMenu();

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // ウィンドウの×ボタンを押したときはタスクトレイに最小化格納
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  startClipboardPoller();
});
