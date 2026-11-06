import React, { useState } from 'react';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Globe, 
  QrCode, 
  Key, 
  Send, 
  Check, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  Copy,
  ShieldCheck
} from 'lucide-react';
import { DeviceInfo, AppSettings } from '../types';

interface DeviceManagerProps {
  devices: DeviceInfo[];
  settings: AppSettings;
  onSimulateIncomingClip: (sourceDevice: DeviceInfo, text: string) => Promise<void>;
  passphraseFingerprint: string;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  devices,
  settings,
  onSimulateIncomingClip,
  passphraseFingerprint,
}) => {
  const [copiedPairingCode, setCopiedPairingCode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccessText, setSimulationSuccessText] = useState<string | null>(null);

  // Pre-configured mock / discovered paired devices across PC, Smartphone, Tablet
  const defaultDevices: DeviceInfo[] = [
    {
      id: 'dev_win_11_pro',
      name: 'Main Workstation (Windows 11 PC)',
      type: 'windows',
      networkName: 'Home_5G_AC',
      ip: '192.168.1.102',
      isOnline: true,
      lastSeen: Date.now() - 1000 * 45,
    },
    {
      id: 'dev_pixel_8_pro',
      name: 'Google Pixel 8 Pro (Smartphone)',
      type: 'android',
      networkName: 'Home_5G_AC',
      ip: '192.168.1.115',
      isOnline: true,
      lastSeen: Date.now() - 1000 * 120,
    },
    {
      id: 'dev_galaxy_tab',
      name: 'Galaxy Tab S9 (Tablet)',
      type: 'tablet',
      networkName: 'Home_5G_AC',
      ip: '192.168.1.120',
      isOnline: true,
      lastSeen: Date.now() - 1000 * 300,
    },
  ];

  const allDevices = [...defaultDevices, ...devices.filter(d => !defaultDevices.some(dd => dd.id === d.id))];

  const handleCopyPairingKey = () => {
    navigator.clipboard.writeText(settings.passphrase);
    setCopiedPairingCode(true);
    setTimeout(() => setCopiedPairingCode(false), 2000);
  };

  const handleSimulate = async (type: 'phone_2fa' | 'pc_code' | 'tablet_url') => {
    setIsSimulating(true);
    try {
      if (type === 'phone_2fa') {
        const phone = allDevices.find((d) => d.type === 'android') || allDevices[1];
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await onSimulateIncomingClip(phone, `[認証コード] 銀行ワンタイムパスワード: ${code} (有効期限: 10分)`);
        setSimulationSuccessText(`スマホから2FA認証コード (${code}) を暗号化受信しました`);
      } else if (type === 'pc_code') {
        const pc = allDevices.find((d) => d.type === 'windows') || allDevices[0];
        const snippet = `git clone https://github.com/myteam/syncclip-core.git\ncd syncclip-core\nnpm install && npm run build`;
        await onSimulateIncomingClip(pc, snippet);
        setSimulationSuccessText('Windows PCからGitコマンドスニペットを暗号化受信しました');
      } else {
        const tablet = allDevices.find((d) => d.type === 'tablet') || allDevices[2];
        const url = `https://www.figma.com/design/syncclip-ui-spec-2026?node-id=${Math.floor(Math.random() * 999)}`;
        await onSimulateIncomingClip(tablet, url);
        setSimulationSuccessText('タブレットからFigmaデザインURLを暗号化受信しました');
      }
      setTimeout(() => setSimulationSuccessText(null), 3000);
    } finally {
      setIsSimulating(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'windows':
        return <Laptop className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'android':
        return <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>ペアリング済み端末一覧 (PC・スマホ・タブレット)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              同一の暗号化キーを共有している端末同士で、指定ネットワーク接続時に自動でクリップボードを同期します。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopyPairingKey}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {copiedPairingCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPairingCode ? '暗号キーコピー済' : 'ペアリング暗号キーをコピー'}</span>
            </button>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {allDevices.map((dev) => (
            <div
              key={dev.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                    {getDeviceIcon(dev.type)}
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>オンライン</span>
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {dev.name}
                </h4>

                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>種別:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {dev.type === 'windows' ? 'PC (Windows)' : dev.type === 'android' ? 'スマホ (Android)' : 'タブレット (Tablet)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>接続NW:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                      {dev.networkName || 'Home_5G_AC'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IPアドレス:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {dev.ip || '192.168.1.xxx'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>自動起動常駐: ON</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">E2EE 接続</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Device Live Simulation Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>他端末からの同期テスト (クロスデバイス送受信シミュレーター)</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            他端末でクリップボードがコピーされた際の自動暗号化通信＆本端末での自動受信・復号動作をシミュレートできます。
          </p>
        </div>

        {simulationSuccessText && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{simulationSuccessText}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleSimulate('phone_2fa')}
            className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/20 text-left transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                スマホからコピー送信
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              SMSで届いたワンタイム2FA認証コードの同期をシミュレート
            </p>
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleSimulate('pc_code')}
            className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/20 text-left transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Laptop className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Windows PCからコピー送信
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              開発端末でコピーしたGitコマンドや複数行コードの同期
            </p>
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleSimulate('tablet_url')}
            className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/20 text-left transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Tablet className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                タブレットからコピー送信
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              ブラウザで閲覧中のデザインURLや記事リンクの同期
            </p>
          </button>

        </div>
      </div>

      {/* Security Verification */}
      <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            全ペアリング端末の共通暗号化鍵フィンガープリント: <strong className="font-mono text-slate-800 dark:text-slate-200">{passphraseFingerprint}</strong>
          </span>
        </div>
        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
          暗号化一致
        </span>
      </div>

    </div>
  );
};
