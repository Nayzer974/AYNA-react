# 🔧 Guide : Déployer la correction de l'Edge Function Brevo

## 📋 Problème corrigé

L'Edge Function `send-verification-email-brevo` retournait l'erreur "Cet email est déjà vérifié" même lors d'une nouvelle inscription, ce qui bloquait l'envoi de l'email.

## ✅ Correction apportée

La vérification "email déjà vérifié" a été temporairement désactivée pour permettre les tests.

## 🚀 Déploiement

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# Depuis le dossier application
cd application

# Déployer l'Edge Function
supabase functions deploy send-verification-email-brevo
```

### Option 2 : Via Supabase Dashboard

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** dans le menu de gauche
4. Cliquez sur **send-verification-email-brevo**
5. Cliquez sur **Edit**
6. Copiez-collez le contenu mis à jour de `application/supabase/functions/send-verification-email-brevo/index.ts`
7. Cliquez sur **Deploy**

## ✅ Vérification

Après le déploiement, testez une nouvelle inscription :

1. Créez un nouveau compte
2. Vérifiez les logs dans la console
3. L'email devrait être envoyé via Brevo sans l'erreur "Cet email est déjà vérifié"

## 📝 Notes

- La vérification "email déjà vérifié" est temporairement désactivée (`if (false && user.email_confirmed_at)`)
- En production, vous pouvez réactiver cette vérification si nécessaire
- L'Edge Function continue de fonctionner même si l'email est déjà vérifié (pour permettre de renvoyer l'email)

---

**Dernière mise à jour :** 2025-01-27






