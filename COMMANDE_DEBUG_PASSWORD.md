# 🔍 Commandes de Debug - Changement de Mot de Passe

## 1. Redéployer l'Edge Function avec les logs

```bash
cd D:\ayna_final\application
supabase functions deploy send-password-change-email
```

## 2. Voir les logs en temps réel

```bash
supabase functions logs send-password-change-email --follow
```

## 3. Tester l'Edge Function directement

```bash
curl -X POST https://ctupecolapegiogvmwxz.supabase.co/functions/v1/send-password-change-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -d '{
    "userEmail": "votre-email@example.com",
    "userName": "Test User",
    "changeType": "settings"
  }'
```

## 4. Vérifier que l'Edge Function est déployée

```bash
supabase functions list
```

Vous devriez voir `send-password-change-email` dans la liste.

## 5. Vérifier les secrets

```bash
supabase secrets list
```

Vous devriez voir `BREVO_API_KEY` dans la liste.

## 🔍 Points à vérifier dans les logs

1. **L'Edge Function est-elle appelée ?**
   - Cherchez : `[send-password-change-email] Requête reçue:`
   
2. **Les données sont-elles reçues ?**
   - Cherchez : `[send-password-change-email] Données reçues:`
   
3. **Le lien est-il généré ?**
   - Cherchez : `[send-password-change-email] Génération du lien pour:`
   - Cherchez : `[send-password-change-email] Lien généré avec succès`
   
4. **L'email est-il envoyé via Brevo ?**
   - Cherchez : `[send-password-change-email] Envoi de l'email via Brevo à:`
   - Cherchez : `[send-password-change-email] Email envoyé avec succès via Brevo`
   - Cherchez : `[send-password-change-email] Message ID:`

5. **Y a-t-il des erreurs ?**
   - Cherchez : `[send-password-change-email] Erreur`

## ⚠️ Problèmes courants

### L'email n'existe pas dans Supabase Auth
- **Symptôme** : Logs montrent "User not found" ou similaire
- **Solution** : Vérifiez que l'email existe dans Supabase Dashboard > Authentication > Users

### Le lien n'est pas généré
- **Symptôme** : Logs montrent "Aucun lien de réinitialisation généré"
- **Solution** : Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien configuré

### L'email n'est pas envoyé via Brevo
- **Symptôme** : Logs montrent une erreur Brevo
- **Solution** : Vérifiez que `BREVO_API_KEY` est valide et active

### L'Edge Function n'est pas appelée
- **Symptôme** : Aucun log dans Supabase
- **Solution** : Vérifiez que l'Edge Function est bien déployée et que l'app l'appelle correctement





