# ⚠️ Edge Functions Obsolètes

## 📋 Note importante

Ces Edge Functions sont **obsolètes** depuis la migration vers le nouveau système d'envoi d'email via **Brevo SMTP** configuré directement dans Supabase Dashboard.

## 🗑️ Edge Functions à supprimer (optionnel)

Les Edge Functions suivantes ne sont plus utilisées et peuvent être supprimées :

- `send-verification-email-brevo/` - Remplacé par Supabase Auth avec Brevo SMTP
- `send-email-brevo/` - Remplacé par Supabase Auth avec Brevo SMTP
- `send-password-reset-brevo/` - Remplacé par Supabase Auth avec Brevo SMTP

## ✅ Edge Functions toujours utilisées

Ces Edge Functions sont toujours nécessaires :

- `resend-verification-email/` - Peut être utile comme fallback
- `reset-password/` - Utilisée pour la réinitialisation de mot de passe
- `verify-email/` - Utilisée pour la vérification d'email via page web

## 🔄 Migration

Le nouveau système utilise :
- **Brevo SMTP** configuré dans Supabase Dashboard > Authentication > Email Templates > SMTP Settings
- **Deep links** (`ayna://auth/callback`) pour les callbacks
- **Supabase Auth** directement (`supabase.auth.signUp()`, `supabase.auth.resend()`, etc.)

Plus besoin d'Edge Functions pour l'envoi d'email - Supabase gère tout automatiquement via Brevo SMTP.

---

**Date de migration :** 2025-01-27





