# Guide : Configurer les politiques RLS pour les sessions de dhikr

## Problème

Si vous obtenez l'erreur `new row violates row-level security policy` lors de la création ou de la gestion de sessions de dhikr, c'est que les politiques RLS (Row Level Security) ne sont pas correctement configurées.

## Solution

### Option 1 : Via l'éditeur SQL de Supabase (Recommandé)

1. **Ouvrir l'éditeur SQL dans Supabase**
   - Allez sur votre projet Supabase
   - Cliquez sur "SQL Editor" dans le menu de gauche

2. **Exécuter le script SQL**
   - Ouvrez le fichier `scripts/setup-dhikr-sessions-rls.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run" ou appuyez sur `Ctrl+Enter` (ou `Cmd+Enter` sur Mac)

3. **Vérifier que les politiques sont créées**
   - Le script affichera les politiques créées à la fin
   - Vous devriez voir 12 politiques au total (4 par table)

### Option 2 : Via l'interface graphique (Alternative)

Si vous préférez configurer manuellement via l'interface :

1. **Table `dhikr_sessions`**
   - Allez dans "Authentication" > "Policies"
   - Sélectionnez la table `dhikr_sessions`
   - Créez 4 politiques :
     - **SELECT** : `USING (true)`
     - **INSERT** : `WITH CHECK (true)`
     - **UPDATE** : `USING (true) WITH CHECK (true)`
     - **DELETE** : `USING (true)`

2. **Table `dhikr_session_participants`**
   - Répétez les mêmes étapes pour cette table

3. **Table `dhikr_session_clicks`**
   - Répétez les mêmes étapes pour cette table

## Notes importantes

⚠️ **Sécurité** : Ces politiques permettent à **tout le monde** (authentifié ou non) d'accéder aux tables. C'est intentionnel pour permettre l'utilisation sans authentification obligatoire.

Si vous souhaitez restreindre l'accès plus tard, vous pouvez modifier les politiques pour :
- Exiger l'authentification : `USING (auth.uid() IS NOT NULL)`
- Limiter aux propriétaires : `USING (created_by = auth.uid())`
- Ajouter d'autres conditions selon vos besoins

## Vérification

Après avoir exécuté le script, testez :
1. Créer une session de dhikr
2. Rejoindre une session
3. Ajouter des clics à une session
4. Voir les sessions actives

Toutes ces opérations devraient fonctionner sans erreur RLS.


