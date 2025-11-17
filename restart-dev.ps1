# PowerShell script to restart Next.js dev server with clean cache
Write-Host "Stopping any running Next.js processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Cleaning Next.js cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ Cache cleared" -ForegroundColor Green
}

Write-Host "Starting dev server..." -ForegroundColor Green
npm run dev


