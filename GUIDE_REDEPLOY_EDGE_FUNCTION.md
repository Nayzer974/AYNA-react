# 🚀 Guide : Redéployer une Edge Function Supabase

## 📋 Quand redéployer ?

Vous devez redéployer une Edge Function lorsque vous :
- Modifiez le code de la fonction
- Changez le modèle d'email
- Ajoutez de nouvelles fonctionnalités
- Corrigez des bugs

## ✅ Méthode 1 : Via le Dashboard Supabase (Recommandé)

### Étapes :

1. **Allez sur [https://app.supabase.com](https://app.supabase.com)**
2. **Sélectionnez votre projet**
3. **Allez dans Edge Functions** dans le menu de gauche
4. **Trouvez la fonction `send-feedback`**
5. **Cliquez sur la fonction** pour l'ouvrir
6. **Copiez le nouveau code** depuis `supabase/functions/send-feedback/index.ts`
7. **Collez-le dans l'éditeur** (remplacez tout l'ancien code)
8. **Cliquez sur Deploy** ou **Save & Deploy**

### Vérification :

- Un message de succès devrait apparaître
- La fonction devrait être marquée comme "Active"
- Vous pouvez tester en envoyant un feedback depuis l'application

## ✅ Méthode 2 : Via la CLI Supabase (Avancé)

### Prérequis :

```bash
# Installer la CLI si ce n'est pas déjà fait
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet
supabase link --project-ref votre-project-ref
```

### Déploiement :

```bash
# Aller dans le dossier application
cd application

# Déployer la fonction
supabase functions deploy send-feedback
```

### Vérification :

```bash
# Voir les logs de la fonction
supabase functions logs send-feedback
```

## 🔍 Vérifier que le déploiement a réussi

1. **Dans le Dashboard Supabase** :
   - Allez dans **Edge Functions** > **send-feedback**
   - Vérifiez que le statut est "Active"
   - Vérifiez la date de dernière mise à jour

2. **Tester la fonction** :
   - Ouvrez l'application
   - Allez dans **Profil** > **À propos**
   - Envoyez un feedback de test
   - Vérifiez l'email reçu à `pro.ibrahima00@gmail.com`
   - L'email devrait avoir le nouveau design

## 🐛 En cas de problème

### Erreur : "Function deployment failed"

**Solutions** :
- Vérifiez la syntaxe du code (pas d'erreurs TypeScript)
- Vérifiez que tous les imports sont corrects
- Vérifiez les logs dans le Dashboard pour plus de détails

### L'email n'a pas le nouveau design

**Solutions** :
- Vérifiez que vous avez bien redéployé la fonction
- Vérifiez que le code a bien été mis à jour dans le Dashboard
- Attendez quelques minutes (le cache peut prendre du temps)
- Testez avec un nouveau feedback

### Erreur : "BREVO_API_KEY not found"

**Solutions** :
- Vérifiez que le secret `BREVO_API_KEY` est bien configuré
- Redéployez la fonction après avoir ajouté le secret
- Vérifiez que le nom du secret est exactement `BREVO_API_KEY`

## 📝 Notes importantes

- **Temps de déploiement** : Généralement 30 secondes à 2 minutes
- **Cache** : Les changements peuvent prendre quelques minutes pour être complètement actifs
- **Versioning** : Supabase garde une trace des versions précédentes
- **Rollback** : Vous pouvez revenir à une version précédente si nécessaire

## ✅ C'est prêt !

Une fois la fonction redéployée, tous les nouveaux feedbacks utiliseront le nouveau modèle d'email professionnel.

---

**Dernière mise à jour :** 2025-01-27





