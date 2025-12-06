# Guide : Configurer les politiques RLS via l'interface graphique

Si vous obtenez une erreur de permission avec le script SQL, utilisez cette méthode via l'interface graphique de Supabase.

## 📋 Étapes détaillées

### 1. Accéder aux politiques du bucket

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Storage** dans le menu de gauche
4. Cliquez sur le bucket **avatars** (ou créez-le d'abord si nécessaire)
5. Cliquez sur l'onglet **Policies**

### 2. Créer la politique 1 : Upload d'avatars

1. Cliquez sur **New Policy**
2. Choisissez **Create a policy from scratch**
3. Configurez :
   - **Policy name**: `Users can upload their own avatars`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **USING expression**: (laissez vide)
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'avatars' AND name LIKE (auth.uid()::text || '-%')
     ```
4. Cliquez sur **Review** puis **Save policy**

### 3. Créer la politique 2 : Lecture des avatars (public)

1. Cliquez sur **New Policy**
2. Choisissez **Create a policy from scratch**
3. Configurez :
   - **Policy name**: `Anyone can view avatars`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **USING expression**: 
     ```sql
     bucket_id = 'avatars'
     ```
   - **WITH CHECK expression**: (laissez vide)
4. Cliquez sur **Review** puis **Save policy**

### 4. Créer la politique 3 : Mise à jour des avatars

1. Cliquez sur **New Policy**
2. Choisissez **Create a policy from scratch**
3. Configurez :
   - **Policy name**: `Users can update their own avatars`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**: 
     ```sql
     bucket_id = 'avatars' AND name LIKE (auth.uid()::text || '-%')
     ```
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'avatars' AND name LIKE (auth.uid()::text || '-%')
     ```
4. Cliquez sur **Review** puis **Save policy**

### 5. Créer la politique 4 : Suppression des avatars

1. Cliquez sur **New Policy**
2. Choisissez **Create a policy from scratch**
3. Configurez :
   - **Policy name**: `Users can delete their own avatars`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: 
     ```sql
     bucket_id = 'avatars' AND name LIKE (auth.uid()::text || '-%')
     ```
   - **WITH CHECK expression**: (laissez vide)
4. Cliquez sur **Review** puis **Save policy**

## ✅ Vérification

Après avoir créé les 4 politiques, vous devriez voir :
- ✅ Users can upload their own avatars (INSERT)
- ✅ Anyone can view avatars (SELECT)
- ✅ Users can update their own avatars (UPDATE)
- ✅ Users can delete their own avatars (DELETE)

## 🧪 Test

Essayez maintenant d'uploader un avatar depuis l'application. L'erreur devrait être résolue !

