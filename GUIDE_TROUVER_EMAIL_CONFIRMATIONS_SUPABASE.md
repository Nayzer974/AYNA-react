# 🔍 Guide : Trouver l'option "Enable email confirmations" dans Supabase

## 📋 Problème

Vous ne trouvez pas l'option "Enable email confirmations" dans le menu Authentication.

## ✅ Solution : Où trouver l'option

Dans le nouveau dashboard Supabase, l'option se trouve dans **Sign In / Providers** :

### Étape 1 : Accéder à Sign In / Providers

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** dans le menu de gauche
4. Cliquez sur **Sign In / Providers** dans la section **CONFIGURATION**

### Étape 2 : Trouver l'option Email

1. Dans la page **Sign In / Providers**, vous verrez plusieurs onglets ou sections :
   - **Providers** (Google, Apple, etc.)
   - **Email** (ou **Email Auth**)

2. Cliquez sur l'onglet **Email** (ou cherchez la section **Email Auth**)

3. Vous devriez voir plusieurs options :
   - ✅ **Enable sign ups** (doit être activé)
   - ⚠️ **Enable email confirmations** (c'est celle-ci qu'il faut désactiver)
   - **Secure email change** (optionnel)

### Étape 3 : Désactiver la vérification d'email

1. Trouvez le toggle ou la case à cocher **"Enable email confirmations"**
2. **Désactivez** cette option (mettez le toggle sur OFF ou décochez la case)
3. Cliquez sur **Save** pour enregistrer les changements
4. **Attendez 1-2 minutes** pour que les changements prennent effet

## 🔍 Si vous ne trouvez toujours pas l'option

### Option 1 : Vérifier dans URL Configuration

1. Allez dans **Authentication** > **URL Configuration**
2. Vérifiez les paramètres de redirection
3. L'option peut être dans les paramètres avancés

### Option 2 : Utiliser l'API Supabase

Si l'option n'est pas visible dans le Dashboard, vous pouvez la désactiver via l'API :

```bash
# Via Supabase CLI
supabase projects update --disable-email-confirmations
```

### Option 3 : Vérifier la version de Supabase

Si vous utilisez une version récente de Supabase, l'interface peut avoir changé. Dans ce cas :

1. Cherchez dans **Authentication** > **Policies**
2. Ou dans **Authentication** > **Configuration** (si cette section existe)

## 📸 Aide visuelle

L'option devrait ressembler à ceci dans **Sign In / Providers** > **Email** :

```
Email Auth
├── Enable sign ups          [ON]
├── Enable email confirmations [OFF] ← Désactiver cette option
└── Secure email change      [ON/OFF]
```

## ✅ Vérification

Après avoir désactivé l'option :

1. Testez une nouvelle inscription
2. L'inscription devrait fonctionner sans erreur "Error sending confirmation email"
3. L'email sera envoyé uniquement via Brevo

---

**Dernière mise à jour :** 2025-01-27






