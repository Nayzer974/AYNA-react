# Script pour tester le deep linking des invitations de sessions privees
# Usage: .\test-invitation-link.ps1

$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

Write-Host "Verification de l'emulateur..." -ForegroundColor Cyan
$devices = & $adbPath devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }

if ($devices.Count -eq 0) {
    Write-Host "ERREUR: Aucun appareil connecte" -ForegroundColor Red
    Write-Host "Veuillez demarrer un emulateur ou connecter un appareil" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: Emulateur detecte: $($devices[0])" -ForegroundColor Green

# Verifier si l'app est installee
Write-Host ""
Write-Host "Verification de l'app AYNA..." -ForegroundColor Cyan
$appInstalled = & $adbPath shell pm list packages | Select-String "com.ayna.app"

if (-not $appInstalled) {
    Write-Host "ERREUR: L'app AYNA n'est pas installee sur l'emulateur" -ForegroundColor Red
    Write-Host "Veuillez installer l'app d'abord" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: App AYNA installee" -ForegroundColor Green

# Demander les parametres
Write-Host ""
Write-Host "Entrez les informations de la session:" -ForegroundColor Cyan
$sessionId = Read-Host "Session ID (ex: private_1234567890_abc123)"
$token = Read-Host "Token d'invitation (ex: xyz789_456def)"

if ([string]::IsNullOrWhiteSpace($sessionId) -or [string]::IsNullOrWhiteSpace($token)) {
    Write-Host "ERREUR: Session ID et Token sont requis" -ForegroundColor Red
    exit 1
}

# Construire le deep link
$deepLink = "ayna://dhikr/invite/$sessionId" + "?token=$token"

Write-Host ""
Write-Host "Deep link genere:" -ForegroundColor Cyan
Write-Host "   $deepLink" -ForegroundColor Yellow

# Executer la commande ADB
Write-Host ""
Write-Host "Ouverture de l'app avec le deep link..." -ForegroundColor Cyan
& $adbPath shell am start -W -a android.intent.action.VIEW -d $deepLink com.ayna.app

$exitCode = $LASTEXITCODE
if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "OK: Commande executee avec succes!" -ForegroundColor Green
    Write-Host "L'app devrait s'ouvrir et naviguer vers la session d'invitation" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Si l'app ne s'ouvre pas automatiquement, verifiez:" -ForegroundColor Yellow
    Write-Host "   - Que l'app est bien installee" -ForegroundColor Gray
    Write-Host "   - Que le deep linking est configure dans app.config.js" -ForegroundColor Gray
    Write-Host "   - Que vous avez rebuild l'app apres les modifications" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERREUR: Erreur lors de l'execution de la commande" -ForegroundColor Red
    Write-Host "Code de sortie: $exitCode" -ForegroundColor Gray
}

