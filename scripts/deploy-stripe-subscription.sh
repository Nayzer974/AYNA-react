#!/bin/bash

# Script de déploiement rapide pour le système d'abonnement Stripe
# Usage: ./scripts/deploy-stripe-subscription.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement du système d'abonnement Stripe"
echo "=============================================="
echo ""

# Vérifier que nous sommes dans le bon dossier
if [ ! -d "supabase" ]; then
    echo "❌ Erreur: Le dossier 'supabase' n'existe pas."
    echo "   Assurez-vous d'exécuter ce script depuis le dossier 'application'"
    exit 1
fi

# Étape 1: Appliquer la migration
echo "📦 Étape 1: Application de la migration SQL..."
supabase db push
echo "✅ Migration appliquée"
echo ""

# Étape 2: Vérifier les secrets
echo "🔐 Étape 2: Vérification des secrets..."
echo "   Vérifiez que les secrets suivants sont configurés:"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_PRICE_ID"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - WEB_BASE_URL"
echo ""
read -p "   Les secrets sont-ils configurés? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Configurez les secrets avec:"
    echo "   supabase secrets set STRIPE_SECRET_KEY=sk_..."
    echo "   supabase secrets set STRIPE_PRICE_ID=price_..."
    echo "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
    echo "   supabase secrets set WEB_BASE_URL=https://..."
    exit 1
fi

# Étape 3: Déployer les Edge Functions
echo "🚀 Étape 3: Déploiement des Edge Functions..."
echo ""

echo "   → Déploiement de account-activation-link..."
supabase functions deploy account-activation-link
echo "   ✅ account-activation-link déployé"
echo ""

echo "   → Déploiement de stripe-webhook..."
supabase functions deploy stripe-webhook
echo "   ✅ stripe-webhook déployé"
echo ""

echo "   → Déploiement de get-subscription..."
supabase functions deploy get-subscription
echo "   ✅ get-subscription déployé"
echo ""

echo "   → Déploiement de check-subscription..."
supabase functions deploy check-subscription
echo "   ✅ check-subscription déployé"
echo ""

echo "   → Mise à jour de llama-proxy-ollama-cloud..."
supabase functions deploy llama-proxy-ollama-cloud
echo "   ✅ llama-proxy-ollama-cloud mis à jour"
echo ""

# Étape 4: Vérification
echo "✅ Étape 4: Vérification..."
echo ""
echo "   Fonctions déployées:"
supabase functions list
echo ""

echo "🎉 Déploiement terminé!"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Configurer le webhook dans Stripe Dashboard"
echo "   2. Tester le checkout avec une carte de test"
echo "   3. Vérifier que la subscription est créée en base"
echo ""
echo "📚 Voir GUIDE_DEPLOIEMENT_STRIPE.md pour plus de détails"


