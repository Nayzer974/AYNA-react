# Script de migration des secrets du .env vers Supabase (PowerShell)
# Usage: .\SCRIPT_MIGRATION_SECRETS.ps1

Write-Host "🔐 Migration des secrets du .env vers Supabase" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est installé
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "Installez-le avec: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Vérifier que le fichier .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Fichier .env non trouvé" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  Ce script va:" -ForegroundColor Yellow
Write-Host "1. Lire les clés secrètes du .env"
Write-Host "2. Les configurer dans Supabase Secrets"
Write-Host "3. Créer un fichier .env.backup"
Write-Host "4. Supprimer les clés secrètes du .env"
Write-Host ""
$confirm = Read-Host "Continuer? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Annulé." -ForegroundColor Yellow
    exit 0
}

# Créer une backup du .env
Copy-Item ".env" ".env.backup"
Write-Host "✅ Backup créé: .env.backup" -ForegroundColor Green

# Fonction pour migrer une clé
function Migrate-Key {
    param(
        [string]$EnvKey,
        [string]$SupabaseSecret
    )
    
    # Lire le fichier .env
    $envContent = Get-Content ".env"
    
    # Trouver la ligne avec la clé
    $line = $envContent | Where-Object { $_ -match "^${EnvKey}=" }
    
    if (-not $line) {
        Write-Host "⚠️  ${EnvKey} non trouvé dans .env" -ForegroundColor Yellow
        return
    }
    
    # Extraire la valeur
    $value = $line -replace "^${EnvKey}=", "" -replace '^"', '' -replace '"$', '' -replace "^'", '' -replace "'$", ''
    
    Write-Host "📦 Migration de ${EnvKey}..." -ForegroundColor Yellow
    
    # Configurer le secret Supabase
    $result = supabase secrets set "${SupabaseSecret}=${value}" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ${SupabaseSecret} configuré dans Supabase" -ForegroundColor Green
        
        # Supprimer la ligne du .env
        $newContent = $envContent | Where-Object { $_ -notmatch "^${EnvKey}=" }
        $newContent | Set-Content ".env"
        Write-Host "✅ ${EnvKey} supprimé du .env" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors de la configuration de ${SupabaseSecret}" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
}

# Migrer les clés
Write-Host ""
Write-Host "🔄 Migration des clés..." -ForegroundColor Cyan
Write-Host ""

# Ollama
Migrate-Key "EXPO_PUBLIC_OLLAMA_API_KEY" "OLLAMA_API_KEY"

# OpenRouter
Migrate-Key "EXPO_PUBLIC_OPENROUTER_API_KEY" "OPENROUTER_API_KEY"

# AYNA API
Migrate-Key "EXPO_PUBLIC_AYNA_API_PROXY" "AYNA_API_KEY"

# Quran OAuth
Migrate-Key "EXPO_PUBLIC_QURAN_CLIENT_SECRET" "QURAN_CLIENT_SECRET"

Write-Host ""
Write-Host "✅ Migration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Vérifier les secrets: supabase secrets list"
Write-Host "2. Déployer les Edge Functions"
Write-Host "3. Tester l'application"
Write-Host ""
Write-Host "💾 Backup disponible: .env.backup" -ForegroundColor Green




