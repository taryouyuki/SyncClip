import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Check, 
  Network, 
  Info, 
  Radio
} from 'lucide-react';
import { AppSettings } from '../types';

interface NetworkManagerProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isNetworkAllowed: boolean;
}

export const NetworkManager: React.FC<NetworkManagerProps> = ({
  settings,
  updateSettings,
  isNetworkAllowed,
}) => {
  const [newSsid, setNewSsid] = useState('');

  // Sample network profiles for quick testing/switching
  const simulatedNetworks = [
    { ssid: 'Home_5G_AC', name: '自宅 Wi-Fi (5GHz)', type: 'trusted' },
    { ssid: 'Office_Secure_WiFi', name: 'オフィス社内セキュアLAN', type: 'trusted' },
    { ssid: 'Cafe_Free_Public_WiFi', name: '公衆カフェ フリーWi-Fi (未指定)', type: 'untrusted' },
    { ssid: 'Mobile_Tethering_Pixel', name: 'スマホテザリング', type: 'custom' },
  ];

  const handleAddSsid = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSsid.trim();
    if (!trimmed || settings.allowedNetworks.includes(trimmed)) return;

    updateSettings({
      allowedNetworks: [...settings.allowedNetworks, trimmed],
    });
    setNewSsid('');
  };

  const handleRemoveSsid = (ssid: string) => {
    updateSettings({
      allowedNetworks: settings.allowedNetworks.filter((s) => s !== ssid),
    });
  };

  const handleSimulateNetwork = (ssid: string) => {
    updateSettings({ currentNetwork: ssid });
  };

  return (
    <div className="space-y-6">
      
      {/* Current Network Status Hero */}
      <div className={`p-6 rounded-xl border transition-all ${
        isNetworkAllowed
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isNetworkAllowed
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-rose-600 text-white shadow-sm'
            }`}>
              {isNetworkAllowed ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  現在の接続ネットワーク: {settings.currentNetwork}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  isNetworkAllowed
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                }`}>
                  {isNetworkAllowed ? '自動同期 許可' : '自動同期 停止中'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {isNetworkAllowed
                  ? '指定ネットワークリストに一致しています。端末間でのクリップボード自動暗号化同期が実行されます。'
                  : '指定外のネットワークです。プライバシー保護のためクリップボードの外部送信は遮断されています。'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>指定ネットワーク時のみ同期</span>
              <input
                type="checkbox"
                checked={settings.networkFilterEnabled}
                onChange={(e) => updateSettings({ networkFilterEnabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Network Simulation Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ネットワーク接続テスト (シミュレーション)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              接続先ネットワークを切り替えて、自動同期の遮断・許可動作をリアルタイムで確認できます。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {simulatedNetworks.map((net) => {
            const isCurrent = settings.currentNetwork === net.ssid;
            const isWhitelisted = settings.allowedNetworks.includes(net.ssid);

            return (
              <button
                key={net.ssid}
                type="button"
                onClick={() => handleSimulateNetwork(net.ssid)}
                className={`p-3 rounded-lg border text-left transition-all relative ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <span className="truncate">{net.name}</span>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">
                  SSID: {net.ssid}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                    isWhitelisted
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isWhitelisted ? '指定NW (同期可)' : '未指定 (遮断)'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Allowed Networks Whitelist */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>指定ネットワーク一覧 (ホワイトリスト)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ここに登録されたWi-Fi SSIDまたはLANセグメントに接続している場合のみ、端末間でクリップボードを共有します。
            </p>
          </div>

          <form onSubmit={handleAddSsid} className="flex items-center gap-2">
            <input
              type="text"
              value={newSsid}
              onChange={(e) => setNewSsid(e.target.value)}
              placeholder="新しいWi-Fi SSIDを入力..."
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48"
            />
            <button
              type="submit"
              disabled={!newSsid.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>追加</span>
            </button>
          </form>
        </div>

        {/* Whitelist Grid */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          {settings.allowedNetworks.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              指定ネットワークが登録されていません。任意のネットワークで同期されます。
            </div>
          ) : (
            settings.allowedNetworks.map((ssid) => {
              const isCurrent = settings.currentNetwork === ssid;
              return (
                <div
                  key={ssid}
                  className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                      <Wifi className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {ssid}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isCurrent ? '● 現在接続中' : '待機中'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveSsid(ssid)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="このネットワークを削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Security Tip Callout */}
      <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl flex items-start gap-3 text-xs text-sky-800 dark:text-sky-200">
        <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div>
          <h5 className="font-semibold text-sky-900 dark:text-sky-100 mb-1">
            なぜ指定ネットワーク制限が重要なのか？
          </h5>
          <p className="leading-relaxed text-sky-800/90 dark:text-sky-300/90">
            クリップボードにはパスワード、ワンタイム認証コード、秘密鍵などの重要機密が含まれることがあります。SyncClipの指定ネットワーク制限により、信頼できる自宅や会社のLAN以外ではクリップボード同期を完全停止し、安全なネットワークに再接続した際にのみ自動同期を再開します。
          </p>
        </div>
      </div>

    </div>
  );
};
