import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { ClipboardHub } from './components/ClipboardHub';
import { NetworkManager } from './components/NetworkManager';
import { DeviceManager } from './components/DeviceManager';
import { GitHubBuildCenter } from './components/GitHubBuildCenter';
import { SettingsModal } from './components/SettingsModal';
import { EncryptedPayloadModal } from './components/EncryptedPayloadModal';
import { ClipboardItem, AppSettings, DeviceInfo } from './types';
import { 
  encryptText, 
  decryptText, 
  generateKeyFingerprint, 
  detectClipType 
} from './utils/crypto';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Settings State (Initialized to user request specifications)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('syncclip_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      maxHistory: 5, // Default 5 items as requested: "アプリ内で５個くらいの過去クリップボードを見れる"
      autoSync: true, // "基本的に自動同期"
      networkFilterEnabled: true, // "指定ネットワークの時同期した端末で共有"
      allowedNetworks: ['Home_5G_AC', 'Office_Secure_WiFi'],
      currentNetwork: 'Home_5G_AC',
      encryptionEnabled: true, // "通信の暗号化にも対応させてください"
      passphrase: 'SyncClipSecure2026!Key',
      autoStartOnBoot: true, // "端末起動時自動起動+同期"
      backgroundService: true, // "バックグラウンド"
      soundNotification: true,
      autoCopyToSystem: false,
      deviceType: 'windows',
      deviceName: 'Windows 11 Workstation',
    };
  });

  const updateSettings = (newPartial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      localStorage.setItem('syncclip_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'clipboard' | 'network' | 'devices' | 'github'>('clipboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<ClipboardItem | null>(null);
  const [passphraseFingerprint, setPassphraseFingerprint] = useState('8F3C-9A12-B4E8-710D');

  // Key fingerprint update on passphrase change
  useEffect(() => {
    generateKeyFingerprint(settings.passphrase).then(setPassphraseFingerprint);
  }, [settings.passphrase]);

  // Is current network allowed under the policy
  const isNetworkAllowed = useMemo(() => {
    if (!settings.networkFilterEnabled) return true;
    return settings.allowedNetworks.includes(settings.currentNetwork);
  }, [settings.networkFilterEnabled, settings.allowedNetworks, settings.currentNetwork]);

  // Initial Seed History (Default 5 items to showcase)
  const [history, setHistory] = useState<ClipboardItem[]>([]);

  // Seed initial sample data if empty
  useEffect(() => {
    const seedInitialClips = async () => {
      const initialSeedTexts = [
        {
          text: '749-218 (ワンタイムSMS認証コード)',
          type: 'text' as const,
          device: { id: 'pixel_8', name: 'Google Pixel 8 Pro', type: 'android' as const, networkName: 'Home_5G_AC' },
          timestamp: Date.now() - 1000 * 60 * 2,
          isPinned: true,
        },
        {
          text: 'git clone https://github.com/syncclip/syncclip-core.git\ncd syncclip-core && npm run dev',
          type: 'code' as const,
          device: { id: 'win_pc', name: 'Windows 11 Workstation', type: 'windows' as const, networkName: 'Home_5G_AC' },
          timestamp: Date.now() - 1000 * 60 * 15,
        },
        {
          text: 'https://github.com/trending/developers',
          type: 'url' as const,
          device: { id: 'galaxy_tab', name: 'Galaxy Tab S9 (Tablet)', type: 'tablet' as const, networkName: 'Home_5G_AC' },
          timestamp: Date.now() - 1000 * 60 * 40,
        },
        {
          text: 'curl -X POST https://api.syncclip.local/v1/ping -H "Authorization: Bearer sc_sec_99a8"',
          type: 'code' as const,
          device: { id: 'win_pc', name: 'Windows 11 Workstation', type: 'windows' as const, networkName: 'Home_5G_AC' },
          timestamp: Date.now() - 1000 * 60 * 95,
        },
        {
          text: '明日の技術ミーティング資料: https://docs.google.com/presentation/d/123-demo-syncclip',
          type: 'url' as const,
          device: { id: 'pixel_8', name: 'Google Pixel 8 Pro', type: 'android' as const, networkName: 'Home_5G_AC' },
          timestamp: Date.now() - 1000 * 60 * 180,
        },
      ];

      const builtItems: ClipboardItem[] = [];
      for (const item of initialSeedTexts) {
        const encrypted = await encryptText(item.text, settings.passphrase);
        builtItems.push({
          id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          text: item.text,
          type: item.type,
          encryptedPayload: encrypted.encryptedPayload,
          iv: encrypted.iv,
          salt: encrypted.salt,
          hash: encrypted.hash,
          device: item.device,
          timestamp: item.timestamp,
          isPinned: item.isPinned || false,
          charCount: item.text.length,
          lineCount: item.text.split('\n').length,
        });
      }
      setHistory(builtItems.slice(0, settings.maxHistory));
    };

    seedInitialClips();
  }, []);

  // Prune history when maxHistory setting changes
  useEffect(() => {
    setHistory((prev) => {
      if (prev.length <= settings.maxHistory) return prev;
      // Retain pinned items if possible
      const pinned = prev.filter((i) => i.isPinned);
      const unpinned = prev.filter((i) => !i.isPinned);
      const remainingSlots = Math.max(0, settings.maxHistory - pinned.length);
      return [...pinned, ...unpinned.slice(0, remainingSlots)].sort(
        (a, b) => b.timestamp - a.timestamp
      );
    });
  }, [settings.maxHistory]);

  // Connect to SSE backend for live real-time sync across devices
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/sync/events');
      
      eventSource.addEventListener('new_clip', async (e: MessageEvent) => {
        try {
          const raw = JSON.parse(e.data);
          // Decrypt payload with user passphrase
          const decrypted = await decryptText(
            raw.encryptedPayload,
            raw.iv,
            raw.salt,
            settings.passphrase
          );

          const newItem: ClipboardItem = {
            id: raw.id,
            text: decrypted,
            type: detectClipType(decrypted),
            encryptedPayload: raw.encryptedPayload,
            iv: raw.iv,
            salt: raw.salt,
            hash: raw.hash,
            device: raw.device,
            timestamp: raw.timestamp || Date.now(),
            charCount: decrypted.length,
            lineCount: decrypted.split('\n').length,
          };

          setHistory((prev) => {
            // avoid duplicates
            if (prev.some((item) => item.hash === newItem.hash)) return prev;
            const updated = [newItem, ...prev];
            // Enforce maxHistory limit while keeping pinned items
            if (updated.length > settings.maxHistory) {
              const unpinnedIndex = updated.map((item, idx) => ({ item, idx }))
                .filter(x => !x.item.isPinned)
                .map(x => x.idx)
                .pop();
              if (unpinnedIndex !== undefined) {
                updated.splice(unpinnedIndex, 1);
              } else {
                updated.pop();
              }
            }
            return updated;
          });
        } catch (err) {
          // Could not decrypt (different passphrase)
          console.warn('Received encrypted packet with non-matching key');
        }
      });
    } catch {
      // Offline or direct client mode
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [settings.passphrase, settings.maxHistory]);

  // Send a new clipboard text
  const handleSendClip = useCallback(
    async (text: string) => {
      // 1. Check network restriction
      if (settings.networkFilterEnabled && !settings.allowedNetworks.includes(settings.currentNetwork)) {
        alert(
          `【同期ブロック】指定外ネットワーク "${settings.currentNetwork}" に接続中です。\nセキュリティ設定により同期が停止されています。「指定ネットワーク」タブで許可リストを確認してください。`
        );
        return;
      }

      // 2. Encrypt
      const encrypted = await encryptText(text, settings.passphrase);

      const newItem: ClipboardItem = {
        id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text,
        type: detectClipType(text),
        encryptedPayload: encrypted.encryptedPayload,
        iv: encrypted.iv,
        salt: encrypted.salt,
        hash: encrypted.hash,
        device: {
          id: 'dev_current_local',
          name: settings.deviceName,
          type: settings.deviceType,
          networkName: settings.currentNetwork,
        },
        timestamp: Date.now(),
        charCount: text.length,
        lineCount: text.split('\n').length,
      };

      // 3. Update local state respecting maxHistory limit
      setHistory((prev) => {
        const withoutDupes = prev.filter((i) => i.hash !== newItem.hash);
        const updated = [newItem, ...withoutDupes];
        if (updated.length > settings.maxHistory) {
          const unpinnedIndex = updated.map((item, idx) => ({ item, idx }))
            .filter(x => !x.item.isPinned)
            .map(x => x.idx)
            .pop();
          if (unpinnedIndex !== undefined) {
            updated.splice(unpinnedIndex, 1);
          } else {
            updated.pop();
          }
        }
        return updated;
      });

      // 4. Send to backend relay
      try {
        await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newItem.id,
            encryptedPayload: newItem.encryptedPayload,
            iv: newItem.iv,
            salt: newItem.salt,
            hash: newItem.hash,
            device: newItem.device,
            timestamp: newItem.timestamp,
          }),
        });
      } catch (err) {
        // Backend push failed, local sync retained
      }
    },
    [settings]
  );

  // Read OS Clipboard
  const handleRefreshFromSystemClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard?.readText) {
        alert('ブラウザのクリップボード読み取り権限が必要です。');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        alert('OSクリップボードは空でした。');
        return;
      }
      await handleSendClip(text);
    } catch (err) {
      alert('クリップボードの読み取りが拒否されました。入力欄に直接ペーストしてください。');
    }
  }, [handleSendClip]);

  // Simulate incoming clip from another device
  const handleSimulateIncomingClip = useCallback(
    async (sourceDevice: DeviceInfo, text: string) => {
      const encrypted = await encryptText(text, settings.passphrase);

      const newItem: ClipboardItem = {
        id: `clip_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text,
        type: detectClipType(text),
        encryptedPayload: encrypted.encryptedPayload,
        iv: encrypted.iv,
        salt: encrypted.salt,
        hash: encrypted.hash,
        device: {
          id: sourceDevice.id,
          name: sourceDevice.name,
          type: sourceDevice.type,
          networkName: sourceDevice.networkName || settings.currentNetwork,
        },
        timestamp: Date.now(),
        charCount: text.length,
        lineCount: text.split('\n').length,
      };

      setHistory((prev) => {
        const withoutDupes = prev.filter((i) => i.hash !== newItem.hash);
        const updated = [newItem, ...withoutDupes];
        if (updated.length > settings.maxHistory) {
          const unpinnedIndex = updated.map((item, idx) => ({ item, idx }))
            .filter(x => !x.item.isPinned)
            .map(x => x.idx)
            .pop();
          if (unpinnedIndex !== undefined) {
            updated.splice(unpinnedIndex, 1);
          } else {
            updated.pop();
          }
        }
        return updated;
      });
    },
    [settings]
  );

  const handleDeleteClip = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTogglePin = (id: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewClip={() => {
          setActiveTab('clipboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        isAutoSync={settings.autoSync}
        isNetworkAllowed={isNetworkAllowed}
        historyCount={history.length}
        maxHistory={settings.maxHistory}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'clipboard' && (
          <ClipboardHub
            history={history}
            settings={settings}
            onSendClip={handleSendClip}
            onDeleteClip={handleDeleteClip}
            onTogglePin={handleTogglePin}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onInspectPayload={(item) => setInspectingItem(item)}
            isNetworkAllowed={isNetworkAllowed}
            onRefreshFromSystemClipboard={handleRefreshFromSystemClipboard}
            passphraseFingerprint={passphraseFingerprint}
          />
        )}

        {activeTab === 'network' && (
          <NetworkManager
            settings={settings}
            updateSettings={updateSettings}
            isNetworkAllowed={isNetworkAllowed}
          />
        )}

        {activeTab === 'devices' && (
          <DeviceManager
            devices={[]}
            settings={settings}
            onSimulateIncomingClip={handleSimulateIncomingClip}
            passphraseFingerprint={passphraseFingerprint}
          />
        )}

        {activeTab === 'github' && (
          <GitHubBuildCenter />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">SyncClip</span>
            <span>·</span>
            <span>AES-256-GCM 暗号化クリップボード同期</span>
            <span>·</span>
            <span className="font-mono">Android & Windows GitHub Build Ready</span>
          </div>
          <div>
            <span>指定ネットワーク保護 & 起動時自動起動常駐</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
        passphraseFingerprint={passphraseFingerprint}
      />

      {/* Encrypted Payload Inspector Modal */}
      <EncryptedPayloadModal
        item={inspectingItem}
        onClose={() => setInspectingItem(null)}
        passphraseFingerprint={passphraseFingerprint}
      />

    </div>
  );
}
