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
  ExternalLink
} from 'lucide-react';
import { REPO_FILES, RepoFile, generateProjectZip } from '../utils/repoTemplates';

export const GitHubBuildCenter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<RepoFile>(REPO_FILES[0]);
  const [copiedFile, setCopiedFile] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'workflow' | 'android' | 'windows' | 'docs'>('all');

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
              GitHub Actions で自動ビルドできるよう、Android (Kotlin / Gradle / バックグラウンドサービス / 起動時自動起動) と Windows (Electron / トレイ常駐 / レジストリ自動起動) の完全なソースコードとワークフロー一式を出力可能です。
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

        {/* 3 Steps to GitHub Build */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center">1</span>
              <span>ZIPを解凍＆Git初期化</span>
            </div>
            <code className="block p-2 mt-1 bg-white dark:bg-slate-900 rounded font-mono text-[11px] text-slate-700 dark:text-slate-300">
              git init && git add .
            </code>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center">2</span>
              <span>GitHubへPush</span>
            </div>
            <code className="block p-2 mt-1 bg-white dark:bg-slate-900 rounded font-mono text-[11px] text-slate-700 dark:text-slate-300">
              git push -u origin main
            </code>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center">3</span>
              <span>ActionsでAPK & EXE取得</span>
            </div>
            <p className="p-2 mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              ActionsのArtifactsから <strong>.apk</strong> と <strong>.exe</strong> をダウンロード
            </p>
          </div>
        </div>
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
              Android (6)
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
