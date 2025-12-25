# 🔑 Guide : Configurer BREVO_API_KEY pour les Edge Functions

## 📋 Objectif

Configurer la variable d'environnement `BREVO_API_KEY` dans Supabase pour permettre à l'Edge Function `send-feedback` d'envoyer des emails via Brevo.

## ✅ Étapes de Configuration

### Étape 1 : Obtenir votre clé API Brevo

1. Allez sur [https://app.brevo.com](https://app.brevo.com)
2. Connectez-vous à votre compte Brevo
3. Allez dans **Settings** (Paramètres) > **SMTP & API**
4. Dans la section **API Keys**, vous verrez vos clés API existantes
5. Si vous n'avez pas de clé API, cliquez sur **Generate New Key**
   - Donnez un nom à votre clé (ex: "Supabase Edge Functions")
   - Sélectionnez les permissions : **Send emails** (au minimum)
   - Cliquez sur **Generate**
6. **⚠️ IMPORTANT** : Copiez la clé API immédiatement, vous ne pourrez plus la voir après !

### Étape 2 : Configurer la variable dans Supabase Dashboard

#### Option A : Via l'interface graphique (Recommandé)

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** dans le menu de gauche
4. Cliquez sur **Settings** (ou **Secrets** selon votre version)
5. Dans la section **Secrets** ou **Environment Variables**, cliquez sur **Add Secret** ou **Add Variable**
6. Remplissez les champs :
   - **Name**: `BREVO_API_KEY`
   - **Value**: Collez votre clé API Brevo (celle que vous avez copiée à l'étape 1)
7. Cliquez sur **Save** ou **Add**

#### Option B : Via la CLI Supabase (Avancé)

Si vous utilisez la CLI Supabase :

```bash
# Installer la CLI si ce n'est pas déjà fait
npm install -g supabase

# Se connecter à votre projet
supabase login

# Lier votre projet local à votre projet Supabase
supabase link --project-ref votre-project-ref

# Définir le secret
supabase secrets set BREVO_API_KEY=votre-cle-api-brevo
```

### Étape 3 : Vérifier la configuration

1. Dans Supabase Dashboard, allez dans **Edge Functions** > **Settings**
2. Vérifiez que `BREVO_API_KEY` apparaît dans la liste des secrets
3. **⚠️ Note** : La valeur de la clé ne sera pas visible (pour des raisons de sécurité), mais le nom devrait apparaître

### Étape 4 : Redéployer l'Edge Function (si nécessaire)

Si vous avez déjà déployé l'Edge Function `send-feedback` avant de configurer le secret :

1. Allez dans **Edge Functions**
2. Trouvez la fonction `send-feedback`
3. Cliquez sur **Redeploy** ou **Deploy** pour redémarrer la fonction avec le nouveau secret

## 🔍 Vérification

Pour tester que tout fonctionne :

1. Ouvrez l'application
2. Allez dans **Profil** > **À propos**
3. Cliquez sur **"Envoyer un avis / Signaler un bug"**
4. Remplissez le formulaire et envoyez un feedback
5. Vérifiez votre boîte email `pro.ibrahima00@gmail.com` pour voir si l'email est bien reçu

## 🐛 Dépannage

### Erreur : "BREVO_API_KEY n'est pas configurée"

**Solution** :
- Vérifiez que vous avez bien créé le secret dans Supabase Dashboard
- Vérifiez que le nom est exactement `BREVO_API_KEY` (sensible à la casse)
- Redéployez l'Edge Function après avoir ajouté le secret

### Erreur : "Invalid API key" ou "Unauthorized"

**Solution** :
- Vérifiez que vous avez copié la bonne clé API (pas la SMTP Key)
- Vérifiez que la clé API a les permissions nécessaires (Send emails)
- Vérifiez que la clé API n'a pas expiré ou été révoquée

### L'email n'est pas envoyé

**Solution** :
1. Vérifiez les logs de l'Edge Function dans Supabase Dashboard > **Edge Functions** > **send-feedback** > **Logs**
2. Vérifiez que votre compte Brevo a encore des crédits disponibles
3. Vérifiez que l'adresse email de destination (`pro.ibrahima00@gmail.com`) est correcte

## 📝 Notes importantes

- **SMTP Key vs API Key** : 
  - La **SMTP Key** est utilisée pour la configuration SMTP dans Supabase Dashboard
  - L'**API Key** est utilisée pour les Edge Functions
  - Ce sont deux clés différentes !

- **Sécurité** :
  - Ne partagez jamais votre clé API
  - Ne commitez jamais la clé API dans votre code
  - Utilisez toujours les secrets Supabase pour stocker les clés

- **Limites Brevo** :
  - Plan gratuit : 300 emails/jour
  - Vérifiez votre quota dans Brevo Dashboard > **Statistics**

## ✅ C'est prêt !

Une fois la variable `BREVO_API_KEY` configurée, l'Edge Function `send-feedback` pourra envoyer des emails via Brevo.

---

**Dernière mise à jour :** 2025-01-27





