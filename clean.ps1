Write-Host "Cleaning up project..." -ForegroundColor Green

# Remove Next.js cache
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Removed .next directory" -ForegroundColor Yellow
}

# Remove node modules and package-lock
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "Removed node_modules directory" -ForegroundColor Yellow
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "Removed package-lock.json" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Green
npm install

Write-Host "`nCleanup complete! You can now restart your development server." -ForegroundColor Green
Write-Host "Run: npm run dev" -ForegroundColor Cyan
