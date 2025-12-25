# Script PowerShell pour tester le deep linking des invitations
# Usage: .\test-deep-link.ps1 -SessionId "private_1234567890_abc123" -Token "xyz789_456def"

param(
    [Parameter(Mandatory=$true)]
    [string]$SessionId,
    
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path $adbPath)) {
    Write-Host "❌ ADB non trouvé à: $adbPath" -ForegroundColor Red
    Write-Host "Veuillez installer Android SDK ou spécifier le chemin d'ADB" -ForegroundColor Yellow
    exit 1
}

# Vérifier les appareils connectés
Write-Host "🔍 Vérification des appareils connectés..." -ForegroundColor Cyan
$devices = & $adbPath devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }

if ($devices.Count -eq 0) {
    Write-Host "❌ Aucun appareil Android connecté" -ForegroundColor Red
    Write-Host "Veuillez connecter un appareil ou démarrer un émulateur" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Appareil(s) connecté(s):" -ForegroundColor Green
$devices | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

# Construire le deep link
$deepLink = "ayna://dhikr/invite/$SessionId`?token=$Token"

Write-Host "`n🔗 Test du deep link:" -ForegroundColor Cyan
Write-Host "   $deepLink" -ForegroundColor Yellow

# Exécuter la commande ADB
Write-Host "`n🚀 Ouverture de l'app avec le deep link..." -ForegroundColor Cyan
& $adbPath shell am start -W -a android.intent.action.VIEW -d $deepLink com.ayna.app

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Commande exécutée avec succès!" -ForegroundColor Green
    Write-Host "L'app devrait s'ouvrir et naviguer vers la session d'invitation" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Erreur lors de l'exécution de la commande" -ForegroundColor Red
}





