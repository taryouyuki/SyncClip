# SyncClip Windows Auto-Start Installer (PowerShell)
# Fulfills requirement: "端末起動時自動起動+同期"

$AppName = "SyncClip"
$AppPath = "$PSScriptRoot\dist\SyncClip.exe"
$RegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"

Write-Host "SyncClip Windows 起動時自動起動を設定中..." -ForegroundColor Cyan

if (Test-Path $AppPath) {
    Set-ItemProperty -Path $RegPath -Name $AppName -Value "`"$AppPath`" --hidden"
    Write-Host "[成功] Windows起動時の自動起動レジストリが登録されました。" -ForegroundColor Green
    Write-Host "キー: $RegPath\$AppName" -ForegroundColor Yellow
} else {
    Write-Host "[注意] $AppPath が見つかりませんでした。ビルド後に再実行してください。" -ForegroundColor Red
}
