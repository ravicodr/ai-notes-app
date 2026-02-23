Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
$nextDir = "C:\Users\ravi\Downloads\ai-notes-app\.next"
Get-ChildItem $nextDir -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
Remove-Item $nextDir -Force -Recurse -ErrorAction SilentlyContinue
if (Test-Path $nextDir) { Write-Host "STILL_EXISTS" } else { Write-Host "DELETED" }
