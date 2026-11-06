@echo off
echo ========================================================
echo SyncClip Windows 起動時自動起動バッチ登録
echo ========================================================

REG ADD "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "SyncClip" /t REG_SZ /d "\"%~dp0dist\SyncClip.exe\" --hidden" /f

echo.
echo [完了] Windows起動時自動起動が有効化されました。
echo バックグラウンドでシステムトレイに常駐し、自動同期を行います。
pause
