import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Lock, 
  Key, 
  Wifi, 
  RefreshCw, 
  Power, 
  Layers, 
  Sliders, 
  Check, 
  Volume2, 
  ClipboardCheck, 
  Smartphone,
  Laptop,
  Tablet,
  Shuffle
} from 'lucide-react';
import { AppSettings, DeviceType } from '../types';
import { generateSecurePassphrase } from '../utils/crypto';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  passphraseFingerprint: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
  passphraseFingerprint,
}) => {
  const [passphraseInput, setPassphraseInput] = useState(settings.passphrase);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  if (!isOpen) return null;

  const handleSavePassphrase = () => {
    if (!passphraseInput.trim()) return;
    updateSettings({ passphrase: passphraseInput.trim() });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const handleGenerateKey = () => {
    const newKey = generateSecurePassphrase(24);
    setPassphraseInput(newKey);
    updateSettings({ passphrase: newKey });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                SyncClip アプリ環境設定
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                履歴上限・自動起動・指定ネットワーク・AES-256暗号化
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">

          {/* Section 1: History Retention Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>過去クリップボード保持・表示件数 (拡張設定)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  アプリ内で保持する過去クリップボードの最大件数を指定します。(デフォルト: 5件)
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                現在: {settings.maxHistory} 件
              </span>
            </div>

            {/* History Selector Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[5, 10, 20, 30, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateSettings({ maxHistory: num })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    settings.maxHistory === num
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold ring-1 ring-emerald-600'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-sm font-mono">{num}件</div>
                  <div className="text-[10px] text-slate-400">
                    {num === 5 ? '標準' : '拡張'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 2: Boot Auto-start & Background */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Power className="w-3.5 h-3.5 text-emerald-600" />
              <span>端末起動時自動起動 ＆ バックグラウンド常駐設定</span>
            </h4>

            <div className="space-y-2.5">
              {/* Auto start on boot */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    端末起動時の自動起動 (Auto-start on Boot)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Windows起動時 (Runレジストリ) および Android起動完了時 (BOOT_COMPLETED) に自動起動します。
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoStartOnBoot}
                  onChange={(e) => updateSettings({ autoStartOnBoot: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Background service */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    バックグラウンド常駐・自動同期 (Background Service)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    アプリ画面を閉じた後もシステムトレイ・常駐通知バーでクリップボードを監視します。
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.backgroundService}
                  onChange={(e) => updateSettings({ backgroundService: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Auto sync switch */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    クリップボード自動同期 (Auto-Sync)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    OSクリップボードの変化を検知した際に、自動で暗号化して他端末へ送信します。
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={(e) => updateSettings({ autoSync: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 3: E2EE Encryption Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>エンドツーエンド通信暗号化設定 (AES-256-GCM)</span>
              </h4>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                E2EE Active
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>共有暗号化パスフレーズ (全端末で同一のキーを設定)</span>
                <span className="font-mono text-emerald-600 text-[11px]">PBKDF2 SHA-256</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphraseInput}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    {showPassphrase ? '非表示' : '表示'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSavePassphrase}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium whitespace-nowrap shadow-xs"
                >
                  保存
                </button>

                <button
                  type="button"
                  onClick={handleGenerateKey}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 whitespace-nowrap"
                  title="高エントロピーな鍵を自動生成"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>自動生成</span>
                </button>
              </div>

              {savedNotification && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>暗号化キーを更新しました。他端末にも同一のキーを適用してください。</span>
                </div>
              )}

              {/* Fingerprint Display */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">照合用フィンガープリント:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tracking-wider">
                  {passphraseFingerprint}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 4: Device Profile */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>本端末の表示プロファイル</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  端末名 (他端末に表示される名前)
                </label>
                <input
                  type="text"
                  value={settings.deviceName}
                  onChange={(e) => updateSettings({ deviceName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  端末プラットフォーム種別
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['windows', 'android', 'tablet'] as DeviceType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateSettings({ deviceType: t })}
                      className={`p-1.5 rounded text-xs font-medium capitalize border transition-all ${
                        settings.deviceType === t
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t === 'windows' ? 'PC' : t === 'android' ? 'スマホ' : 'タブレット'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-xs"
          >
            完了
          </button>
        </div>

      </div>
    </div>
  );
};
