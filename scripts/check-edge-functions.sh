#!/bin/bash

# Script pour vérifier le statut des Edge Functions

echo "🔍 Vérification des Edge Functions..."
echo ""

# Vérifier que nous sommes dans le bon dossier
if [ ! -d "supabase" ]; then
    echo "❌ Erreur: Le dossier 'supabase' n'existe pas."
    echo "   Assurez-vous d'exécuter ce script depuis le dossier 'application'"
    exit 1
fi

# Lister les fonctions
echo "📋 Fonctions déployées:"
supabase functions list
echo ""

# Vérifier les secrets
echo "🔐 Secrets configurés:"
supabase secrets list
echo ""

# Vérifier les logs récents
echo "📝 Logs récents (get-subscription):"
supabase functions logs get-subscription --limit 5
echo ""

echo "📝 Logs récents (account-activation-link):"
supabase functions logs account-activation-link --limit 5
echo ""

echo "✅ Vérification terminée"
echo ""
echo "💡 Si des fonctions sont manquantes, déployez-les avec:"
echo "   supabase functions deploy get-subscription"
echo "   supabase functions deploy account-activation-link"
echo ""
echo "💡 Si des secrets sont manquants, configurez-les avec:"
echo "   supabase secrets set STRIPE_SECRET_KEY=sk_..."
echo "   supabase secrets set STRIPE_PRICE_ID=price_..."
echo "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
echo "   supabase secrets set WEB_BASE_URL=https://..."


