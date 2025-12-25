#!/bin/bash

# Script de migration des secrets du .env vers Supabase
# Usage: ./SCRIPT_MIGRATION_SECRETS.sh

echo "🔐 Migration des secrets du .env vers Supabase"
echo "=============================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI n'est pas installé${NC}"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Fichier .env non trouvé${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  Ce script va:${NC}"
echo "1. Lire les clés secrètes du .env"
echo "2. Les configurer dans Supabase Secrets"
echo "3. Créer un fichier .env.backup"
echo "4. Supprimer les clés secrètes du .env"
echo ""
read -p "Continuer? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Annulé."
    exit 0
fi

# Créer une backup du .env
cp .env .env.backup
echo -e "${GREEN}✅ Backup créé: .env.backup${NC}"

# Fonction pour migrer une clé
migrate_key() {
    local env_key=$1
    local supabase_secret=$2
    
    # Extraire la valeur du .env
    local value=$(grep "^${env_key}=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  ${env_key} non trouvé dans .env${NC}"
        return
    fi
    
    echo -e "${YELLOW}📦 Migration de ${env_key}...${NC}"
    
    # Configurer le secret Supabase
    if supabase secrets set "${supabase_secret}=${value}"; then
        echo -e "${GREEN}✅ ${supabase_secret} configuré dans Supabase${NC}"
        
        # Supprimer la ligne du .env
        sed -i.bak "/^${env_key}=/d" .env
        echo -e "${GREEN}✅ ${env_key} supprimé du .env${NC}"
    else
        echo -e "${RED}❌ Erreur lors de la configuration de ${supabase_secret}${NC}"
    fi
}

# Migrer les clés
echo ""
echo "🔄 Migration des clés..."
echo ""

# Ollama
migrate_key "EXPO_PUBLIC_OLLAMA_API_KEY" "OLLAMA_API_KEY"

# OpenRouter
migrate_key "EXPO_PUBLIC_OPENROUTER_API_KEY" "OPENROUTER_API_KEY"

# AYNA API
migrate_key "EXPO_PUBLIC_AYNA_API_PROXY" "AYNA_API_KEY"

# Quran OAuth
migrate_key "EXPO_PUBLIC_QURAN_CLIENT_SECRET" "QURAN_CLIENT_SECRET"

echo ""
echo -e "${GREEN}✅ Migration terminée!${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Vérifier les secrets: supabase secrets list"
echo "2. Déployer les Edge Functions"
echo "3. Tester l'application"
echo ""
echo "💾 Backup disponible: .env.backup"




