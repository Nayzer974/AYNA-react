# ⚡ Déploiement Rapide - Edge Function

Guide rapide pour déployer la solution de production en 5 minutes.

## 🚀 Commandes Rapides

```bash
# 1. Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# 2. Se connecter
supabase login

# 3. Lier le projet
supabase link --project-ref ctupecolapegiogvmwxz

# 4. Configurer les secrets (remplacez les valeurs)
supabase secrets set SUPABASE_URL=https://ctupecolapegiogvmwxz.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role

# 5. Déployer la fonction
supabase functions deploy verify-email
```

## 📝 Configuration des secrets

Pour obtenir votre `SUPABASE_SERVICE_ROLE_KEY` :
1. Allez dans **Supabase Dashboard** > **Settings** > **API**
2. Copiez la clé **service_role** (⚠️ Ne la partagez jamais !)

## 🌐 Déploiement du HTML

1. Uploadez `oauth-consent-secure.html` sur votre serveur
2. Placez-le à : `http://nurayna.com/oauth/consent`
3. Vérifiez que l'URL Supabase dans le fichier est correcte (ligne 198)

## ✅ Configuration Supabase Dashboard

1. **Authentication** > **URL Configuration**
2. Ajoutez dans **Redirect URLs** :
   - `http://nurayna.com/oauth/consent`
   - `https://nurayna.com/oauth/consent`
   - `ayna://email-verified`

## 🧪 Test

1. Créez un nouveau compte dans l'app
2. Vérifiez l'email reçu
3. Cliquez sur le lien de vérification
4. Vous devriez être redirigé vers la page de consentement
5. L'email devrait être vérifié automatiquement

---

📚 Pour plus de détails, consultez `GUIDE_DEPLOIEMENT_EDGE_FUNCTION.md`

