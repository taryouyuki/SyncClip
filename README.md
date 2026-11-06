# SyncClip - Cross-Platform Encrypted Clipboard

PC・スマートフォン・タブレット間でクリップボードをセキュアに自動同期するアプリケーションです。

## 主な機能

1. **自動暗号化同期**: AES-256-GCM (PBKDF2 100,000回反復) により、端末間で送信されるクリップボードデータを完全暗号化。
2. **指定ネットワーク制限**: 自宅Wi-Fiや社内LANなど、指定したSSID/ネットワークに接続している時だけ自動同期。外出時の公衆Wi-Fiでの誤送信を防止。
3. **クリップボード履歴管理**: 直近5件（設定で10〜100件まで拡張可能）の過去クリップボードを保持・検索・ピン留め。
4. **バックグラウンド & 端末起動時自動起動**:
   - **Android**: `BOOT_COMPLETED` 受信レシーバー ＋ `ForegroundService` による省電力バックグラウンド常駐。
   - **Windows**: Windowsレジストリ `Run` キー ＋ Electron システムトレイ常駐による起動時自動実行。
5. **GitHub CI/CD 自動ビルド対応**: GitHub Actions で Android APK および Windows EXE を全自動ビルド・リリース。

---

## 📁 リポジトリ構成

```text
.
├── .github/
│   └── workflows/
│       ├── build-android.yml    # Android APK 自動ビルドワークフロー
│       └── build-windows.yml    # Windows EXE 自動ビルドワークフロー
├── android/                     # Android (Kotlin / Jetpack Compose) アプリプロジェクト
│   ├── settings.gradle.kts
│   ├── build.gradle.kts
│   └── app/
│       ├── build.gradle.kts
│       └── src/main/
│           ├── AndroidManifest.xml
│           └── java/com/syncclip/app/
│               ├── MainActivity.kt
│               ├── ClipboardListenerService.kt
│               ├── BootCompletedReceiver.kt
│               ├── NetworkSSIDChecker.kt
│               └── CryptoManager.kt
├── windows/                     # Windows (Electron) デスクトップアプリプロジェクト
│   ├── package.json
│   ├── main.js
│   ├── install-autostart.bat
│   └── install-autostart.ps1
├── src/                         # Web版 UI / PWA クライアント
├── server.ts                    # 暗号化同期ハブサーバー
└── README.md
```

---

## 🚀 GitHub Actions でのビルド方法

本リポジトリを GitHub に Push するだけで、GitHub Actions が自動的に Android と Windows のバイナリをビルドします。

```bash
# 1. ローカルでリポジトリ初期化
git init
git add .
git commit -m "feat: SyncClip multi-device encrypted clipboard"

# 2. GitHub リポジトリへプッシュ
git branch -M main
git remote add origin https://github.com/<あなたのユーザー名>/<リポジトリ名>.git
git push -u origin main
```

プッシュ完了後、GitHub の **Actions** タブで:
- **Build Android App (APK)**: `SyncClip-Android-Debug-APK` が生成されます。
- **Build Windows Desktop App (EXE)**: `SyncClip-Windows-x64-Setup` が生成されます。
