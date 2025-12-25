# Script de nettoyage du cache pour résoudre l'erreur "runtime not ready"
# À exécuter dans PowerShell depuis le dossier application/

Write-Host "🧹 Nettoyage du cache Metro et Expo..." -ForegroundColor Cyan

# 1. Arrêter tous les processus Metro/Expo
Write-Host "`n1. Arrêt des processus Metro/Expo..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" -or $_.CommandLine -like "*expo*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Nettoyer le cache Metro
Write-Host "2. Nettoyage du cache Metro..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
    Write-Host "   ✓ Dossier .expo supprimé" -ForegroundColor Green
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "   ✓ Cache node_modules supprimé" -ForegroundColor Green
}

# 3. Nettoyer le cache watchman (si installé)
Write-Host "3. Nettoyage du cache Watchman..." -ForegroundColor Yellow
watchman watch-del-all 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Cache Watchman nettoyé" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Watchman non installé (optionnel)" -ForegroundColor Yellow
}

# 4. Nettoyer le cache npm/yarn
Write-Host "4. Nettoyage du cache npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null
Write-Host "   ✓ Cache npm nettoyé" -ForegroundColor Green

# 5. Supprimer node_modules et réinstaller (optionnel mais recommandé)
Write-Host "`n5. Voulez-vous supprimer node_modules et réinstaller ? (y/n)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "   Suppression de node_modules..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
        Write-Host "   ✓ node_modules supprimé" -ForegroundColor Green
    }
    
    Write-Host "   Réinstallation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Dépendances réinstallées" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Erreur lors de la réinstallation" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ Nettoyage terminé !" -ForegroundColor Green
Write-Host "`n📱 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "   1. Redémarrez Expo Go complètement (fermez l'app)" -ForegroundColor White
Write-Host "   2. Lancez: npm start -- --clear" -ForegroundColor White
Write-Host "   3. Re-scannez le QR code" -ForegroundColor White

