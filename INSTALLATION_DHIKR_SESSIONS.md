# Installation rapide : Correction création de sessions dhikr

## 🚀 Installation en 3 étapes

### Étape 1 : Ouvrir SQL Editor dans Supabase

1. Aller sur votre projet Supabase
2. Cliquer sur **SQL Editor** dans le menu latéral
3. Cliquer sur **New query**

### Étape 2 : Exécuter le premier script

Copier-coller le contenu de `scripts/create-dhikr-session-direct.sql` et exécuter.

**Ce script crée la fonction principale avec toutes les vérifications de sécurité.**

### Étape 3 : Exécuter le second script

Copier-coller le contenu de `scripts/create-dhikr-session-simple.sql` et exécuter.

**Ce script crée la fonction de fallback (version simplifiée).**

## ✅ Vérification

Exécuter cette requête pour vérifier que les fonctions sont créées :

```sql
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname IN ('create_dhikr_session_direct', 'create_dhikr_session_simple');
```

Vous devriez voir les deux fonctions listées.

## 🧪 Test

1. Se connecter à l'application mobile
2. Aller dans "DairatAnNur" (CercleDhikr)
3. Créer une nouvelle session
4. ✅ Ça devrait fonctionner maintenant !

## 📝 Notes

- Le code client est déjà mis à jour
- Les deux fonctions sont nécessaires (la deuxième sert de fallback)
- Les logs dans la console vous diront quelle fonction a été utilisée

## ❓ Problème ?

Si ça ne fonctionne toujours pas :
1. Vérifier les logs dans la console de l'application
2. Vérifier que les deux scripts SQL ont bien été exécutés
3. Vérifier que l'utilisateur est bien connecté (même sans email vérifié)


