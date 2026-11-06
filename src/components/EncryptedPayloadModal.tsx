import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, X, Lock, Key, Hash } from 'lucide-react';
import { ClipboardItem } from '../types';

interface EncryptedPayloadModalProps {
  item: ClipboardItem | null;
  onClose: () => void;
  passphraseFingerprint: string;
}

export const EncryptedPayloadModal: React.FC<EncryptedPayloadModalProps> = ({
  item,
  onClose,
  passphraseFingerprint,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPlaintext, setShowPlaintext] = useState(false);

  if (!item) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                暗号化ペイロード検証 (E2EE)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AES-256-GCM / PBKDF2 (100,000 iterations)
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Key Fingerprint verification */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  暗号化鍵フィンガープリント
                </div>
                <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 tracking-wider">
                  {passphraseFingerprint}
                </div>
              </div>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-medium">
              E2EE 一致
            </span>
          </div>

          {/* Ciphertext */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                暗号文 (Ciphertext - Base64)
              </label>
              <button
                onClick={() => handleCopy(item.encryptedPayload, 'cipher')}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
              >
                {copiedKey === 'cipher' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>コピー</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-100 dark:bg-slate-950 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-300 break-all select-all max-h-24 overflow-y-auto border border-slate-200 dark:border-slate-800">
              {item.encryptedPayload || '(暗号文なし)'}
            </pre>
          </div>

          {/* IV & Salt Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  IV (初期化ベクトル 12 bytes)
                </label>
                <button
                  onClick={() => handleCopy(item.iv, 'iv')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                >
                  {copiedKey === 'iv' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="p-2.5 bg-slate-100 dark:bg-slate-950 rounded-lg font-mono text-xs text-slate-700 dark:text-slate-300 break-all border border-slate-200 dark:border-slate-800">
                {item.iv || '未設定'}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Salt (PBKDF2ソルト 16 bytes)
                </label>
                <button
                  onClick={() => handleCopy(item.salt, 'salt')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                >
                  {copiedKey === 'salt' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="p-2.5 bg-slate-100 dark:bg-slate-950 rounded-lg font-mono text-xs text-slate-700 dark:text-slate-300 break-all border border-slate-200 dark:border-slate-800">
                {item.salt || '未設定'}
              </div>
            </div>
          </div>

          {/* SHA-256 Hash */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              コンテンツ SHA-256 (重複排除用ハッシュ)
            </label>
            <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded-lg font-mono text-xs text-slate-600 dark:text-slate-400 break-all border border-slate-200 dark:border-slate-800">
              {item.hash || '計算中'}
            </div>
          </div>

          {/* Plaintext preview toggle */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setShowPlaintext(!showPlaintext)}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1"
              >
                <span>{showPlaintext ? '▼ 復号平文を隠す' : '▶ 復号平文を確認する'}</span>
              </button>
              {showPlaintext && (
                <button
                  onClick={() => handleCopy(item.text, 'plain')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                >
                  {copiedKey === 'plain' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>平文コピー</span>
                </button>
              )}
            </div>
            {showPlaintext && (
              <pre className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-36 overflow-y-auto">
                {item.text}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
          <span>送信元: {item.device.name} ({item.device.networkName || 'LAN'})</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
