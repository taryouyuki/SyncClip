import React, { useState } from 'react';
import { 
  Clipboard, 
  Copy, 
  Check, 
  Lock, 
  Pin, 
  Trash2, 
  ExternalLink, 
  Search, 
  Filter, 
  Sparkles, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Globe, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  ArrowRight,
  Settings as SettingsIcon,
  RefreshCw
} from 'lucide-react';
import { ClipboardItem, AppSettings, ClipType } from '../types';

interface ClipboardHubProps {
  history: ClipboardItem[];
  settings: AppSettings;
  onSendClip: (text: string) => Promise<void>;
  onDeleteClip: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenSettings: () => void;
  onInspectPayload: (item: ClipboardItem) => void;
  isNetworkAllowed: boolean;
  onRefreshFromSystemClipboard: () => Promise<void>;
  passphraseFingerprint: string;
}

export const ClipboardHub: React.FC<ClipboardHubProps> = ({
  history,
  settings,
  onSendClip,
  onDeleteClip,
  onTogglePin,
  onOpenSettings,
  onInspectPayload,
  isNetworkAllowed,
  onRefreshFromSystemClipboard,
  passphraseFingerprint,
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | ClipType | 'pinned'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isReadingSystem, setIsReadingSystem] = useState(false);

  // Filter items
  const filteredHistory = history.filter((item) => {
    // Search filter
    if (searchQuery.trim()) {
      if (!item.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    // Category filter
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pinned') return !!item.isPinned;
    return item.type === selectedFilter;
  });

  const handleCopy = (item: ClipboardItem) => {
    navigator.clipboard.writeText(item.text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendClip(inputText.trim());
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleSystemRead = async () => {
    setIsReadingSystem(true);
    try {
      await onRefreshFromSystemClipboard();
    } finally {
      setIsReadingSystem(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'windows':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'android':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5" />;
      default:
        return <Globe className="w-3.5 h-3.5" />;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 10) return 'たった今';
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    return new Date(timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      
      {/* Real-time Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Sync & Background Status */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              settings.autoSync && isNetworkAllowed
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
            }`}>
              <RefreshCw className={`w-4 h-4 ${settings.autoSync && isNetworkAllowed ? 'animate-spin-slow' : ''}`} />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">自動同期・常駐</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {settings.autoSync ? '自動同期中 (常時)' : '手動同期のみ'}
              </div>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${
            settings.autoSync ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
          }`}>
            {settings.autoSync ? 'Active' : 'Paused'}
          </span>
        </div>

        {/* Network restriction status */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isNetworkAllowed
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400'
                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
            }`}>
              {isNetworkAllowed ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">ネットワーク制限</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                {settings.currentNetwork}
              </div>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            isNetworkAllowed 
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
          }`}>
            {isNetworkAllowed ? '許可済み' : '同期制限中'}
          </span>
        </div>

        {/* E2EE Status */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">暗号化 (E2EE)</div>
              <div className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">
                {passphraseFingerprint.substring(0, 9)}...
              </div>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
            AES-256
          </span>
        </div>

      </div>

      {/* Network Warning Banner if disconnected or restricted */}
      {!isNetworkAllowed && settings.networkFilterEnabled && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              現在未指定のネットワーク <strong>{settings.currentNetwork}</strong> に接続しているため、自動同期を停止しています。
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-xs font-semibold underline hover:text-amber-900 dark:hover:text-amber-100 whitespace-nowrap ml-2"
          >
            許可ネットワークを編集
          </button>
        </div>
      )}

      {/* Quick Input & Local Clipboard Capture Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Clipboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>新規クリップボード暗号化同期</span>
          </div>
          <button
            onClick={handleSystemRead}
            disabled={isReadingSystem}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="現在の端末のOSクリップボードを読み取って送信"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReadingSystem ? 'animate-spin' : ''}`} />
            <span>OSクリップボード取込</span>
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-3">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="共有したいテキスト・URL・コードをペーストまたは入力... (送信時に端末間でAES-256暗号化されます)"
              rows={3}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>{inputText.length} 文字</span>
              <span aria-hidden="true">·</span>
              <span>{inputText.split('\n').filter(Boolean).length || 0} 行</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">宛先: 全ペアリング端末</span>
            </div>

            <div className="flex items-center gap-2">
              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  クリア
                </button>
              )}
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSending ? '暗号化中...' : '暗号化同期'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Clipboard History Section */}
      <div className="space-y-3">
        
        {/* History Header & Limits */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                過去クリップボード一覧
              </h2>
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                {history.length} / {settings.maxHistory} 件
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>デフォルト5件表示</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={onOpenSettings}
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>設定で拡張可能 ({settings.maxHistory}件設定中)</span>
                <SettingsIcon className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="履歴を検索..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg w-fit overflow-x-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            すべて ({history.length})
          </button>
          <button
            onClick={() => setSelectedFilter('url')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedFilter === 'url'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            リンク・URL
          </button>
          <button
            onClick={() => setSelectedFilter('code')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedFilter === 'code'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            コード
          </button>
          <button
            onClick={() => setSelectedFilter('pinned')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedFilter === 'pinned'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            ピン留め
          </button>
        </div>

        {/* History Item Cards */}
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <Clipboard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {searchQuery ? '検索に一致するクリップボードはありません' : 'クリップボード履歴はまだありません'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              PC・スマホ・タブレットで文字をコピーするか、上の入力欄から送信すると自動暗号化同期されます。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item, index) => {
              const isRecent = index === 0;
              return (
                <div
                  key={item.id}
                  className={`group p-4 bg-white dark:bg-slate-900 rounded-xl border transition-all duration-150 ${
                    item.isPinned
                      ? 'border-emerald-300 dark:border-emerald-800/80 shadow-xs bg-emerald-50/15 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Card Meta Row */}
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    
                    {/* Device & Network info */}
                    <div className="flex items-center gap-2 truncate">
                      <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                        {getDeviceIcon(item.device.type)}
                        <span>{item.device.name}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{item.device.networkName || 'LAN'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{formatTimeAgo(item.timestamp)}</span>
                      {isRecent && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                          最新
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      
                      {/* Inspect Encrypted Payload */}
                      <button
                        onClick={() => onInspectPayload(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="暗号化ペイロード (AES-256) を検証"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Pin/Unpin */}
                      <button
                        onClick={() => onTogglePin(item.id)}
                        className={`p-1.5 rounded transition-colors ${
                          item.isPinned
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={item.isPinned ? 'ピン留め解除' : 'ピン留め (履歴自動退避から保護)'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy to system clipboard */}
                      <button
                        onClick={() => handleCopy(item)}
                        className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-colors ${
                          copiedId === item.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                        title="OSクリップボードにコピー"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>コピー済</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>コピー</span>
                          </>
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteClip(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Clip Content Body */}
                  <div className="relative">
                    {item.type === 'url' ? (
                      <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        <ExternalLink className="w-4 h-4 text-sky-500 shrink-0" />
                        <a
                          href={item.text}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline break-all"
                        >
                          {item.text}
                        </a>
                      </div>
                    ) : item.type === 'code' ? (
                      <pre className="p-3 bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-40 leading-relaxed border border-slate-800">
                        <code>{item.text}</code>
                      </pre>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words max-h-36 overflow-y-auto leading-relaxed border border-slate-100 dark:border-slate-800/60">
                        {item.text}
                      </div>
                    )}
                  </div>

                  {/* Bottom details */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <div className="flex items-center gap-2">
                      <span>{item.charCount} 文字</span>
                      <span>·</span>
                      <span className="font-mono">SHA-256: {item.hash.substring(0, 8)}...</span>
                    </div>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      AES-GCM Verified
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Limit expansion hint */}
        {history.length >= settings.maxHistory && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>
              💡 履歴上限 <strong>{settings.maxHistory} 件</strong> に達しています。新しいクリップが来ると最古の未ピン留めアイテムが自動退避されます。
            </span>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap ml-3"
            >
              上限を変更
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
