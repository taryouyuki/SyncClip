import React from 'react';
import { 
  ClipboardCheck, 
  Wifi, 
  Smartphone, 
  Github, 
  Settings, 
  ShieldCheck, 
  Sun, 
  Moon,
  Plus
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'clipboard' | 'network' | 'devices';
  setActiveTab: (tab: 'clipboard' | 'network' | 'devices') => void;
  onOpenSettings: () => void;
  onNewClip: () => void;
  isDark: boolean;
  toggleDark: () => void;
  isAutoSync: boolean;
  isNetworkAllowed: boolean;
  historyCount: number;
  maxHistory: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onNewClip,
  isDark,
  toggleDark,
  isAutoSync,
  isNetworkAllowed,
  historyCount,
  maxHistory,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <button
              onClick={() => setActiveTab('clipboard')}
              className="text-left font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100 hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
            >
              SyncClip
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('clipboard')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'clipboard'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>クリップボード</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300">
                {historyCount}/{maxHistory}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('network')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'network'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>指定ネットワーク</span>
              <span className={`w-2 h-2 rounded-full ${isNetworkAllowed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </button>

            <button
              onClick={() => setActiveTab('devices')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'devices'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>端末・ペアリング</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNewClip}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
              title="新しいテキストを送信"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">手動コピー同期</span>
              <span className="sm:hidden">同期</span>
            </button>

            <button
              onClick={toggleDark}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="テーマ切替"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              aria-label="設定"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('clipboard')}
            className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap ${
              activeTab === 'clipboard'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            クリップボード ({historyCount}/{maxHistory})
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap ${
              activeTab === 'network'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            指定NW
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap ${
              activeTab === 'devices'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            端末一覧
          </button>
        </div>
      </div>
    </header>
  );
};
