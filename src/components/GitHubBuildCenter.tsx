import React, { useState } from 'react';
import { 
  Github, 
  Download, 
  FileCode, 
  Copy, 
  Check, 
  FolderTree, 
  Cpu, 
  Laptop, 
  Smartphone, 
  Terminal, 
  Workflow, 
  FileText,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { REPO_FILES, RepoFile, generateProjectZip } from '../utils/repoTemplates';

export const GitHubBuildCenter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<RepoFile>(REPO_FILES[0]);
  const [copiedFile, setCopiedFile] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'workflow' | 'android' | 'windows' | 'docs'>('all');
  const [showTroubleshooting, setShowTroubleshooting] = useState(true);
  const [activeGuideTab, setActiveGuideTab] = useState<'quick_web' | 'zip_git' | 'manual_run' | 'actions_enable'>('quick_web');

  const filteredFiles = REPO_FILES.filter((file) => {
    if (categoryFilter === 'all') return true;
    return file.category === categoryFilter;
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const blob = await generateProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SyncClip-Android-Windows-GitHub-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workflow':
        return <Workflow className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'android':
        return <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'windows':
        return <Laptop className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100">
                <Github className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Androidアプリ ＆ Windowsアプリ GitHub CI/CD ビルド設定
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              GitHub Actions で自動ビルドできるよう、Android (Kotlin / Gradle / バックグラウンド常駐 / 起動時自動起動) と Windows (Electron / トレイ常駐 / レジストリ自動起動) の完全なソースコードとワークフロー一式を出力可能です。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'ZIP生成中...' : 'リポジトリ一式をZIPダウンロード (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Troubleshooting & Step-by-Step Guide for "Actionsで自動ビルドがない" */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-300 dark:border-amber-700/80 shadow-sm overflow-hidden">
        
        {/* Toggle Bar */}
        <div 
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span>「Actionsで自動ビルドがない / 表示されない」時の解決手順</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-medium">
                  必ず動く対処ガイド
                </span>
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                GitHubにファイルが正しく配置されていないか、有効化設定がオフになっていることが原因です。
              </p>
            </div>
          </div>

          <div className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
            <span>{showTroubleshooting ? '閉じる' : '手順を見る'}</span>
            {showTroubleshooting ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>

        {/* Expandable Guide Body */}
        {showTroubleshooting && (
          <div className="p-6 space-y-6">
            
            {/* Guide Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveGuideTab('quick_web')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeGuideTab === 'quick_web'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>方法①: ブラウザだけで即動かす (最短1分・推奨)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('zip_git')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeGuideTab === 'zip_git'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>方法②: ZIPからGitプッシュする場合の注意点</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('actions_enable')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeGuideTab === 'actions_enable'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>方法③: GitHubのActions有効化ボタン</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('manual_run')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeGuideTab === 'manual_run'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>方法④: 手動実行 (Run workflow)</span>
              </button>
            </div>

            {/* Tab 1: Quick Web Method (No terminal required) */}
            {activeGuideTab === 'quick_web' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200">
                  <strong>💡 GitコマンドやZIP解凍が不要！</strong> ブラウザの GitHub 画面上で直接ワークフローを作成すれば、1分で Actions が自動起動します。
                </div>

                <ol className="space-y-3 list-decimal list-inside text-slate-700 dark:text-slate-300 leading-relaxed">
                  <li className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <strong>GitHubリポジトリ画面を開く:</strong>
                    <div className="mt-1 text-slate-500">
                      GitHubの自分のリポジトリのトップページを開きます。右上の <strong>「Add file」</strong> → <strong>「Create new file」</strong> をクリックします。
                    </div>
                  </li>
                  <li className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <strong>ファイル名を入力（スラッシュで自動フォルダ作成）:</strong>
                    <div className="mt-1 text-slate-500">
                      ファイル名入力欄に以下をそのまま入力してください（スラッシュを入力すると自動的にフォルダ階層になります）:
                    </div>
                    <code className="block p-2 mt-1.5 bg-slate-900 text-emerald-400 rounded font-mono select-all">
                      .github/workflows/build-android.yml
                    </code>
                  </li>
                  <li className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <strong>ワークフローコードを貼り付けてコミット:</strong>
                    <div className="mt-1 text-slate-500">
                      下のファイル一覧から <code>build-android.yml</code> を選び、「コードをコピー」を押してエディタに貼り付けます。
                      右上の緑色の <strong>「Commit changes...」</strong> をクリックします。
                    </div>
                  </li>
                  <li className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <strong>Actions タブを確認:</strong>
                    <div className="mt-1 text-slate-500">
                      コミット後、リポジトリの <strong>「Actions」</strong> タブを開くと、黄色のクルクルアイコン（実行中）が表示され、自動ビルドが始まります！
                    </div>
                  </li>
                </ol>
              </div>
            )}

            {/* Tab 2: ZIP & Git Push Common Pitfalls */}
            {activeGuideTab === 'zip_git' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-900 dark:text-rose-200">
                  <strong>⚠️ 一番多い失敗原因: フォルダが二重になっているか、隠しフォルダがコピーされていない</strong>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-rose-300 dark:border-rose-800">
                    <div className="font-bold text-rose-600 dark:text-rose-400 mb-2">❌ 失敗する構成 (二重フォルダ)</div>
                    <pre className="font-mono text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
{`my-repo/
  └── SyncClip-Project/   <-- 余計なサブフォルダ！
        ├── .github/
        ├── android/
        └── windows/`}
                    </pre>
                    <p className="mt-2 text-slate-500">
                      ※GitHubはリポジトリの直下しか認識しません！サブフォルダ内にあるとActionsは動きません。
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-emerald-300 dark:border-emerald-800">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">✅ 正しい構成 (直下に配置)</div>
                    <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
{`my-repo/
  ├── .github/            <-- ルート直下！
  │     └── workflows/
  │           ├── build-android.yml
  │           └── build-windows.yml
  ├── android/
  └── windows/`}
                    </pre>
                    <p className="mt-2 text-slate-500">
                      ZIPの中身をリポジトリの最上位フォルダに直接展開してください。
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-lg font-mono text-[11px]">
                  <div className="text-slate-500 mb-1"># 正しいGit初期化＆プッシュコマンド:</div>
                  <code className="text-slate-800 dark:text-slate-200 block">
                    cd /解凍したフォルダのパス<br />
                    git init<br />
                    git add .<br />
                    git commit -m "feat: SyncClip multiplatform build"<br />
                    git branch -M main<br />
                    git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git<br />
                    git push -u origin main
                  </code>
                </div>
              </div>
            )}

            {/* Tab 3: Actions Enable Button */}
            {activeGuideTab === 'actions_enable' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                    <span>「I understand my workflows, go ahead and enable them」が表示されている場合</span>
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400">
                    GitHubで新しいリポジトリを作った際や、Forkしたリポジトリではセキュリティのため Actions が一時停止されています。<br />
                    リポジトリ上部の <strong>「Actions」</strong> タブをクリックし、画面中央に表示される緑色のボタン <strong>「I understand my workflows, go ahead and enable them」</strong> をクリックしてください。
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                    <span>リポジトリ設定で Actions が許可されているか確認</span>
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400">
                    リポジトリの <strong>Settings</strong> → 左メニュー <strong>Actions</strong> → <strong>General</strong> を開き、
                    <strong>「Allow all actions and reusable workflows」</strong> にチェックが入っていることを確認してください。
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: Manual Trigger (Run workflow) */}
            {activeGuideTab === 'manual_run' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                  <h5 className="font-bold text-slate-900 dark:text-slate-100">
                    プッシュしなくても今すぐ手動でビルドを開始する方法
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400">
                    SyncClipのワークフローには <code>workflow_dispatch</code> が設定されているため、GitHub上のボタンからいつでも即時ビルドできます。
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
                    <li>GitHubリポジトリの <strong>「Actions」</strong> タブを開く</li>
                    <li>左サイドバーから <strong>「Build Android App (APK)」</strong> または <strong>「Build Windows Desktop App」</strong> を選択</li>
                    <li>右上に表示される <strong>「Run workflow」</strong> ドロップダウンをクリック</li>
                    <li>緑色の <strong>「Run workflow」</strong> ボタンをクリックすると即座にビルドが開始されます！</li>
                  </ol>
                </div>

                {/* Where to find APK / EXE */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-2">
                  <h5 className="font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>完成した .apk や .exe はどこでダウンロードできる？</span>
                  </h5>
                  <p className="text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                    ビルド完了後（約2〜4分）、該当のビルド履歴をクリックすると、画面最下部の <strong>「Artifacts (成果物)」</strong> セクションに:
                    <br />
                    ・<strong>SyncClip-Android-Debug-APK</strong>（スマホにインストールできる .apk）
                    <br />
                    ・<strong>SyncClip-Windows-x64-Setup</strong>（Windows用実行ファイル .exe / .zip）
                    <br />
                    が生成され、ワンクリックで直接ダウンロードできます。
                  </p>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Code Browser & File Explorer */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Sub-header with Category Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              リポジトリ構成ファイル閲覧 ({filteredFiles.length} ファイル)
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setCategoryFilter('workflow')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                categoryFilter === 'workflow'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              GitHub CI (2)
            </button>
            <button
              onClick={() => setCategoryFilter('android')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                categoryFilter === 'android'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Android (7)
            </button>
            <button
              onClick={() => setCategoryFilter('windows')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                categoryFilter === 'windows'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Windows (4)
            </button>
          </div>
        </div>

        {/* 2-Column Split: File List & Code Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          
          {/* File Tree Left Sidebar */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-2 space-y-1 max-h-[550px] overflow-y-auto">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFile(file)}
                  className={`w-full p-2.5 rounded-lg text-left transition-colors flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getCategoryIcon(file.category)}
                    <span className="truncate font-mono">{file.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Right Panel */}
          <div className="lg:col-span-8 flex flex-col bg-slate-950 text-slate-200">
            
            {/* Code Header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-slate-300">
                  {selectedFile.path}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFile ? 'コピー完了' : 'コードをコピー'}</span>
              </button>
            </div>

            {/* Code Body */}
            <pre className="p-4 flex-1 overflow-x-auto text-xs font-mono leading-relaxed select-all text-slate-200">
              <code>{selectedFile.content}</code>
            </pre>

          </div>

        </div>

      </div>

    </div>
  );
};
