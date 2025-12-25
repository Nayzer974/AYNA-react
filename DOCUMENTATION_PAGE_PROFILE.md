# 📄 DOCUMENTATION COMPLÈTE - PAGE PROFILE

**Date de création :** 2025-01-27  
**Fichier source :** `application/src/pages/Profile.tsx`  
**Statut :** ✅ Complètement fonctionnelle et intégrée

---

## 🎯 VUE D'ENSEMBLE

La page **Profile** est l'une des 4 pages principales accessibles via la navigation par onglets (Bottom Tabs). Elle permet à l'utilisateur de gérer son profil, modifier son avatar, consulter ses statistiques et accéder aux paramètres de l'application.

### Position dans l'application

- **Navigation :** Onglet "Profile" (4ème onglet, icône User)
- **Route :** `Profile` (dans `MainTabs`)
- **Protection :** Requiert authentification (`RequireAuth`)
- **Accessibilité :** Accessible depuis n'importe où via l'onglet de navigation

---

## 📁 ARCHITECTURE ET STRUCTURE

### Fichier principal

```
application/src/pages/Profile.tsx (677 lignes)
```

### Dépendances principales

#### Contextes React
- `UserContext` : État utilisateur global, authentification, analytics
- `PreferencesContext` : Préférences utilisateur (thème, langue)

#### Services
- `supabase.ts` : Client Supabase pour authentification et storage
- `analytics.ts` : Tracking des événements et pages vues

#### Composants UI
- `Button` : Boutons avec variants (outline, destructive, default)
- `Card`, `CardHeader`, `CardTitle`, `CardContent` : Cartes d'information
- `Input` : Champ de saisie pour l'édition du nom
- `GalaxyBackground` : Fond animé avec étoiles
- `LinearGradient` : Dégradé de fond

#### Bibliothèques externes
- `expo-image` : Affichage d'images optimisé
- `expo-image-picker` : Sélection d'images depuis la galerie
- `expo-image-manipulator` : Redimensionnement et compression d'images
- `lucide-react-native` : Icônes (User, Camera, LogOut, Save, Settings, etc.)
- `react-i18next` : Internationalisation

#### Données
- `themes.ts` : Système de thèmes (6 thèmes disponibles)
- `avatars.ts` : Avatars prédéfinis (4 avatars : 2 hommes, 2 femmes)

---

## 🎨 DESIGN ET UI

### Structure visuelle

```
┌─────────────────────────────────┐
│  [Avatar circulaire avec caméra] │
│         Nom utilisateur          │
│         [Bouton Éditer]          │
│         Email                    │
├─────────────────────────────────┤
│  📊 Statistiques                │
│  ┌──────┬──────┬──────┐         │
│  │ Dhikr│ Notes│ Jours│         │
│  └──────┴──────┴──────┘         │
├─────────────────────────────────┤
│  🎨 Thème                        │
│  Nom du thème actuel            │
├─────────────────────────────────┤
│  ℹ️ Informations du compte       │
│  • Dernière activité            │
│  • Langue                       │
│  • Statut vérification          │
├─────────────────────────────────┤
│  📱 À propos                     │
│  • Version de l'application     │
├─────────────────────────────────┤
│  [Bouton Paramètres]            │
│  [Bouton Page Test]             │
│  [Bouton Déconnexion]            │
└─────────────────────────────────┘
```

### Thèmes et couleurs

- **Fond :** Dégradé `LinearGradient` + `GalaxyBackground` (étoiles animées)
- **Cartes :** `backgroundSecondary` avec bordure semi-transparente
- **Texte :** `text` (principal) et `textSecondary` (secondaire)
- **Accents :** `accent` (couleur du thème actuel)
- **Boutons :** Variants selon l'action (outline, destructive)

### Responsive et accessibilité

- **ScrollView :** Contenu scrollable pour petits écrans
- **SafeAreaView :** Respect des zones sûres (notch, barre de navigation)
- **Pressable :** Feedback visuel au toucher
- **ActivityIndicator :** Indicateurs de chargement pour les actions asynchrones

---

## ⚙️ FONCTIONNALITÉS DÉTAILLÉES

### 1. Affichage du profil

#### Avatar
- **Affichage :** Avatar circulaire (120x120px) avec bordure de couleur accent
- **Types supportés :**
  - Avatar prédéfini (ID : `male-1`, `female-1`, etc.)
  - Photo personnalisée (URL Supabase Storage)
  - Icône par défaut (User) si aucun avatar
- **Interaction :** Appui sur l'avatar → Menu de sélection
- **Icône caméra :** Badge en bas à droite de l'avatar

#### Nom et email
- **Nom :** Affiché en grand (28px, font-weight 600)
- **Édition :** Bouton "Éditer" pour modifier le nom
- **Email :** Affiché en dessous (14px, couleur secondaire)
- **Validation :** Le nom ne peut pas être vide

### 2. Gestion des avatars

#### Options disponibles

1. **Prendre une photo** (`handlePickImage`)
   - Demande permission galerie
   - Sélection d'image depuis la galerie
   - Redimensionnement automatique (max 800px)
   - Compression JPEG (80%)
   - Upload vers Supabase Storage
   - Suppression de l'ancien avatar si présent

2. **Choisir un avatar** (`handleSelectAvatar`)
   - Modal avec grille d'avatars prédéfinis
   - Filtrage par genre (male/female)
   - Sélection visuelle avec checkmark
   - Sauvegarde de l'`avatar_id` dans `user_metadata`

3. **Supprimer la photo** (`handleRemovePhoto`)
   - Confirmation avant suppression
   - Suppression depuis Supabase Storage
   - Réinitialisation de l'avatar

#### Flux d'upload d'image personnalisée

```
1. Permission galerie → ImagePicker.requestMediaLibraryPermissionsAsync()
2. Sélection image → ImagePicker.launchImageLibraryAsync()
3. Redimensionnement → ImageManipulator.manipulateAsync()
   - Largeur max : 800px
   - Format : JPEG
   - Compression : 0.8
4. Conversion → fetch() → arrayBuffer → Uint8Array
5. Suppression ancien avatar (si présent)
6. Upload Supabase → storage.from('avatars').upload()
7. URL publique → storage.from('avatars').getPublicUrl()
8. Mise à jour profil → updateUser({ avatar: publicUrl })
9. Mise à jour Supabase → auth.updateUser({ data: { avatar_url, avatar_id: null } })
```

#### Gestion des erreurs

- **Erreurs silencieuses :** En production, les erreurs ne bloquent pas l'UI
- **Alertes utilisateur :** Messages d'erreur clairs et traduits
- **Fallback local :** Si Supabase non disponible, sauvegarde locale uniquement
- **Nettoyage automatique :** Suppression de l'ancien avatar avant upload

### 3. Édition du nom

#### Mode édition

- **Activation :** Bouton "Éditer" → Mode édition
- **Champ :** `Input` avec placeholder traduit
- **Actions :**
  - **Annuler :** Retour au mode affichage, restauration du nom original
  - **Sauvegarder :** Validation et sauvegarde

#### Validation

- **Nom requis :** Ne peut pas être vide ou uniquement des espaces
- **Trim :** Suppression des espaces en début/fin
- **Feedback :** Alertes de succès/erreur traduites

#### Sauvegarde

```typescript
updateUser({ name: name.trim() });
// → Déclenche la sauvegarde automatique dans UserContext
// → Debounced 500ms pour AsyncStorage
// → Synchronisation Supabase si en ligne
```

### 4. Statistiques

#### Affichage

Trois statistiques principales affichées dans une carte :

1. **Dhikr** (`user.analytics.totalDhikr`)
   - Total de dhikr effectués
   - Incrémenté via `incrementUserDhikr()` depuis n'importe où

2. **Notes** (`user.analytics.totalNotes`)
   - Total d'entrées de journal
   - Incrémenté lors de la création d'une note

3. **Jours** (`user.analytics.streak`)
   - Série de jours consécutifs actifs
   - Calculé automatiquement via `updateLastActive()`

#### Source des données

- **Stockage :** `user.analytics` (JSONB dans `profiles` Supabase)
- **Synchronisation :** Automatique via `UserContext`
- **Mise à jour :** En temps réel lors des actions utilisateur

### 5. Informations du compte

#### Dernière activité

- **Source :** `user.analytics.lastActive`
- **Format :** Date locale formatée (ex: "27 janvier 2025")
- **Mise à jour :** Automatique au chargement de l'app

#### Langue

- **Source :** `i18n.language`
- **Affichage :** Nom complet de la langue (Français, العربية, English)
- **Modification :** Via page Settings

#### Statut vérification email

- **Source :** `user.emailVerified`
- **Affichage :** "Vérifié" ou "Non vérifié"
- **Icône :** User

### 6. Thème actuel

- **Affichage :** Nom du thème (ex: "Nuit Mystique", "Océan Serein")
- **Source :** `getTheme(user?.theme || 'default')`
- **Modification :** Via page Settings

### 7. Navigation

#### Boutons d'action

1. **Paramètres** (`Settings`)
   - Navigation vers la page Settings
   - Tracking : `settings_opened` (from: 'profile')

2. **Page Test** (`Test`)
   - Navigation vers la page Test (développement)
   - Tracking : `test_page_opened` (from: 'profile')

3. **Déconnexion** (`Logout`)
   - Confirmation avant déconnexion
   - Appel de `logout()` depuis UserContext
   - Tracking : `logout`

---

## 🔄 INTÉGRATIONS

### UserContext

#### Utilisation

```typescript
const { user, updateUser, logout } = useUser();
```

#### Données utilisées

- `user.id` : ID utilisateur
- `user.name` : Nom affiché
- `user.email` : Email
- `user.avatar` : Avatar (ID ou URL)
- `user.gender` : Genre (pour filtrage avatars)
- `user.theme` : Thème actuel
- `user.analytics` : Statistiques
- `user.emailVerified` : Statut vérification

#### Actions déclenchées

- `updateUser({ name })` : Mise à jour du nom
- `updateUser({ avatar })` : Mise à jour de l'avatar
- `logout()` : Déconnexion

### Supabase

#### Storage

- **Bucket :** `avatars`
- **Nommage :** `${userId}-${timestamp}.jpg`
- **Politique RLS :** L'utilisateur peut uploader/supprimer uniquement ses propres avatars
- **URL publique :** Générée automatiquement après upload

#### Auth

- **Mise à jour metadata :**
  - `avatar_id` : Pour avatars prédéfinis
  - `avatar_url` : Pour photos personnalisées
- **Synchronisation :** Automatique avec `updateUser()`

### Analytics

#### Événements trackés

1. **Page view :** `page_view` (page: 'Profile')
2. **Profil mis à jour :** `profile_updated` (field: 'name')
3. **Échec mise à jour :** `profile_update_failed` (error)
4. **Avatar changé :** `avatar_changed` (type: 'predefined' | 'custom_upload' | 'local', avatarId?)
5. **Échec changement avatar :** `avatar_change_failed` (error)
6. **Avatar supprimé :** `avatar_removed`
7. **Échec suppression :** `avatar_remove_failed` (error)
8. **Échec sélection image :** `image_select_failed` (error)
9. **Échec upload :** `avatar_upload_failed` (error)
10. **Paramètres ouverts :** `settings_opened` (from: 'profile')
11. **Page test ouverte :** `test_page_opened` (from: 'profile')
12. **Déconnexion :** `logout`

### Internationalisation (i18n)

#### Clés de traduction utilisées

**Français (`fr.json`) :**
```json
{
  "profile": {
    "changePhoto": "Changer la photo de profil",
    "chooseOption": "Choisissez une option",
    "takePhoto": "Prendre une photo",
    "chooseAvatar": "Choisir un avatar",
    "removePhoto": "Supprimer la photo",
    "removePhotoConfirm": "Voulez-vous supprimer votre photo de profil ?",
    "namePlaceholder": "Votre nom",
    "defaultUser": "Utilisateur",
    "statistics": "Statistiques",
    "dhikr": "Dhikr",
    "notes": "Notes",
    "days": "Jours",
    "accountInfo": "Informations du compte",
    "lastActive": "Dernière activité",
    "language": "Langue",
    "about": "À propos",
    "appVersion": "Version de l'application",
    "logoutConfirm": "Êtes-vous sûr de vouloir vous déconnecter ?",
    "genderRequired": "Veuillez définir votre genre dans les paramètres pour choisir un avatar",
    "permissionRequired": "Permission requise",
    "permissionMessage": "Nous avons besoin de l'accès à vos photos pour changer votre avatar.",
    "error": {
      "nameRequired": "Le nom est requis",
      "saveFailed": "Impossible de sauvegarder le profil",
      "avatarSelectFailed": "Impossible de sélectionner l'avatar",
      "photoRemoveFailed": "Impossible de supprimer la photo",
      "uploadFailed": "Impossible de télécharger la photo",
      "imageSelectFailed": "Impossible de sélectionner l'image"
    },
    "success": {
      "profileUpdated": "Profil mis à jour",
      "avatarUpdated": "Avatar mis à jour",
      "photoUpdated": "Photo de profil mise à jour",
      "photoRemoved": "Photo supprimée",
      "avatarUpdatedLocal": "Avatar mis à jour (local)"
    }
  }
}
```

**Anglais et Arabe :** Traductions équivalentes disponibles

---

## 🗄️ GESTION DES DONNÉES

### Structure des données utilisateur

```typescript
interface UserProfile {
  id?: string;
  name: string;
  email: string;
  avatar?: string; // ID ('male-1') ou URL (Supabase Storage)
  gender?: 'male' | 'female' | 'other' | null;
  theme: 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'galaxy';
  emailVerified?: boolean;
  analytics: {
    totalDhikr: number;
    totalNotes: number;
    streak: number;
    lastActive: string;
  };
}
```

### Stockage

#### Local (AsyncStorage)
- **Clé :** `ayna_user`
- **Format :** JSON stringifié
- **Sauvegarde :** Automatique avec debounce 500ms
- **Chargement :** Au démarrage de l'app (offline-first)

#### Cloud (Supabase)
- **Table :** `profiles`
- **Synchronisation :** Automatique si en ligne
- **Storage :** Bucket `avatars` pour photos personnalisées
- **Metadata :** `auth.users.user_metadata` pour `avatar_id` et `avatar_url`

### Synchronisation

#### Flux de synchronisation

```
1. Modification locale → updateUser()
2. Sauvegarde AsyncStorage (debounced 500ms)
3. Mise à jour Supabase auth metadata (si avatar)
4. Sauvegarde Supabase profiles (debounced 1000ms)
5. Upload Storage (si photo personnalisée)
```

#### Gestion offline

- **Mode offline :** Sauvegarde locale uniquement
- **Retour en ligne :** Synchronisation automatique via `syncService`
- **Queue :** Les modifications sont mises en queue si offline

---

## 🎨 COMPOSANTS UTILISÉS

### Composants UI personnalisés

#### Button
```typescript
<Button
  variant="outline" | "destructive" | "default"
  size="sm" | "default" | "lg"
  icon={Icon}
  iconPosition="left" | "right"
  loading={boolean}
  disabled={boolean}
  onPress={() => {}}
>
  Texte
</Button>
```

#### Card
```typescript
<Card style={cardStyle}>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
</Card>
```

#### Input
```typescript
<Input
  value={name}
  onChangeText={setName}
  placeholder={t('profile.namePlaceholder')}
  containerStyle={styles.nameInput}
/>
```

### Composants React Native

- `ScrollView` : Contenu scrollable
- `SafeAreaView` : Zones sûres
- `Pressable` : Interactions tactiles
- `Modal` : Modal de sélection d'avatar
- `ActivityIndicator` : Indicateurs de chargement
- `Alert` : Alertes système
- `Image` (expo-image) : Affichage d'images optimisé

---

## 🔐 SÉCURITÉ ET PERMISSIONS

### Permissions requises

#### iOS (`Info.plist`)
- `NSPhotoLibraryUsageDescription` : Accès à la galerie photos
- `NSPhotoLibraryAddUsageDescription` : Ajout de photos

#### Android (`AndroidManifest.xml`)
- `READ_EXTERNAL_STORAGE` : Lecture des fichiers
- `WRITE_EXTERNAL_STORAGE` : Écriture des fichiers

### Sécurité Supabase

#### Row Level Security (RLS)

**Table `profiles` :**
- L'utilisateur peut lire/modifier uniquement son propre profil
- Les admins peuvent lire/modifier tous les profils

**Bucket `avatars` :**
- L'utilisateur peut uploader uniquement des fichiers avec son UUID en préfixe
- L'utilisateur peut supprimer uniquement ses propres fichiers
- Les fichiers sont publics en lecture (URL publique)

### Validation

- **Nom :** Trim et validation non-vide
- **Avatar :** Validation du format et de la taille
- **Permissions :** Vérification avant accès galerie

---

## 🐛 GESTION D'ERREURS

### Stratégie

- **Erreurs silencieuses :** En production, les erreurs ne bloquent pas l'UI
- **Alertes utilisateur :** Messages d'erreur clairs et traduits
- **Fallback :** Sauvegarde locale si Supabase indisponible
- **Logs :** Console en développement uniquement

### Cas d'erreur gérés

1. **Permission refusée :** Message explicite avec instruction
2. **Upload échoué :** Message d'erreur avec possibilité de réessayer
3. **Supabase indisponible :** Fallback local avec message informatif
4. **Image invalide :** Validation avant upload
5. **Nom vide :** Validation avant sauvegarde

---

## 📊 PERFORMANCE

### Optimisations

1. **Mémorisation des styles :**
   ```typescript
   const cardStyle = useMemo(() => ({ backgroundColor: theme.colors.backgroundSecondary }), [theme.colors.backgroundSecondary]);
   ```

2. **Lazy loading des images :**
   - `expo-image` avec cache `memory-disk`
   - Transition fluide (200ms)

3. **Debounce des sauvegardes :**
   - AsyncStorage : 500ms
   - Supabase : 1000ms

4. **Redimensionnement d'images :**
   - Max 800px de largeur
   - Compression JPEG 80%
   - Format optimisé pour mobile

5. **Modal conditionnel :**
   - Rendu uniquement si `showAvatarModal === true`

### Métriques

- **Taille du composant :** ~677 lignes
- **Re-renders :** Minimisés via `useMemo` et `useCallback`
- **Taille des images :** Optimisée avant upload

---

## 🧪 TESTS ET VALIDATION

### Scénarios de test

1. **Affichage du profil :**
   - ✅ Avatar affiché correctement
   - ✅ Nom et email affichés
   - ✅ Statistiques correctes

2. **Édition du nom :**
   - ✅ Mode édition activé
   - ✅ Validation nom vide
   - ✅ Sauvegarde réussie
   - ✅ Annulation restaure le nom original

3. **Upload d'avatar :**
   - ✅ Permission demandée
   - ✅ Sélection d'image fonctionnelle
   - ✅ Redimensionnement automatique
   - ✅ Upload Supabase réussi
   - ✅ Ancien avatar supprimé

4. **Sélection avatar prédéfini :**
   - ✅ Modal affichée
   - ✅ Filtrage par genre
   - ✅ Sélection fonctionnelle
   - ✅ Sauvegarde réussie

5. **Suppression avatar :**
   - ✅ Confirmation affichée
   - ✅ Suppression réussie
   - ✅ Avatar réinitialisé

6. **Déconnexion :**
   - ✅ Confirmation affichée
   - ✅ Déconnexion réussie
   - ✅ Redirection vers Login

### Points d'attention

- ⚠️ Tester avec différents genres (male/female/null)
- ⚠️ Tester avec/sans avatar existant
- ⚠️ Tester en mode offline
- ⚠️ Tester avec permissions refusées
- ⚠️ Tester avec Supabase indisponible

---

## 🚀 AMÉLIORATIONS FUTURES POSSIBLES

### Court terme

1. **Prise de photo directe :**
   - Utiliser `ImagePicker.launchCameraAsync()` pour prendre une photo
   - Actuellement, seule la galerie est supportée

2. **Recadrage d'image :**
   - Ajouter un outil de recadrage avant upload
   - Améliorer l'expérience utilisateur

3. **Prévisualisation avant upload :**
   - Afficher un aperçu de l'image avant confirmation
   - Permettre de changer d'avis

4. **Progression d'upload :**
   - Afficher une barre de progression lors de l'upload
   - Améliorer le feedback utilisateur

### Moyen terme

1. **Édition de profil avancée :**
   - Modifier le genre
   - Modifier la localisation
   - Ajouter une bio

2. **Statistiques détaillées :**
   - Graphiques de progression
   - Historique des activités
   - Comparaison avec d'autres utilisateurs

3. **Export de données :**
   - Télécharger toutes les données utilisateur
   - Format JSON ou PDF

4. **Badges et récompenses :**
   - Système de badges basé sur les statistiques
   - Affichage des récompenses obtenues

### Long terme

1. **Profil social :**
   - Partage de profil
   - Suivre d'autres utilisateurs
   - Profil public/privé

2. **Personnalisation avancée :**
   - Thèmes personnalisés
   - Couleurs personnalisées
   - Layout personnalisable

3. **Intégration sociale :**
   - Partage sur réseaux sociaux
   - Inviter des amis
   - Connexions avec d'autres utilisateurs

---

## 📝 NOTES TECHNIQUES

### Détails d'implémentation

#### Gestion des avatars

**Format de stockage :**
- **Avatar prédéfini :** `'male-1'`, `'female-1'`, etc.
- **Photo personnalisée :** URL Supabase Storage complète

**Détection du type :**
```typescript
const isAvatarId = avatar && !avatar.startsWith('http') && !avatar.startsWith('/') && !avatar.includes('/storage/');
```

**Affichage conditionnel :**
```typescript
const avatar = getAvatarById(user.avatar);
if (avatar) {
  // Avatar prédéfini
  return <Image source={avatar.image} />;
}
if (user.avatar.startsWith('http') || user.avatar.startsWith('/')) {
  // URL d'image
  return <Image source={{ uri: user.avatar }} />;
}
// Icône par défaut
return <User size={48} />;
```

#### Upload d'image

**Conversion en Uint8Array :**
```typescript
const response = await fetch(manipulatedImage.uri);
const arrayBuffer = await response.arrayBuffer();
const uint8Array = new Uint8Array(arrayBuffer);
```

**Upload Supabase :**
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(filePath, uint8Array, {
    contentType: 'image/jpeg',
    upsert: true,
  });
```

#### Synchronisation

**Mise à jour auth metadata :**
```typescript
await supabase.auth.updateUser({
  data: {
    avatar_url: urlData.publicUrl,
    avatar_id: null // Supprimer l'avatar_id si présent
  }
});
```

**Mise à jour profil :**
```typescript
updateUser({ avatar: urlData.publicUrl });
// → Déclenche la sauvegarde automatique dans UserContext
```

---

## 🔗 LIENS ET RESSOURCES

### Fichiers liés

- `src/contexts/UserContext.tsx` : Contexte utilisateur
- `src/services/supabase.ts` : Client Supabase
- `src/services/analytics.ts` : Service analytics
- `src/data/avatars.ts` : Avatars prédéfinis
- `src/data/themes.ts` : Système de thèmes
- `src/components/ui/` : Composants UI réutilisables

### Documentation externe

- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/image-picker/)
- [Expo Image Manipulator](https://docs.expo.dev/versions/latest/sdk/image-manipulator/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [React Navigation](https://reactnavigation.org/)

---

## ✅ CHECKLIST DE VALIDATION

### Fonctionnalités

- [x] Affichage du profil utilisateur
- [x] Édition du nom
- [x] Upload de photo personnalisée
- [x] Sélection d'avatar prédéfini
- [x] Suppression d'avatar
- [x] Affichage des statistiques
- [x] Affichage des informations du compte
- [x] Navigation vers Settings
- [x] Déconnexion

### Intégrations

- [x] UserContext
- [x] Supabase Storage
- [x] Supabase Auth
- [x] Analytics
- [x] Internationalisation (i18n)

### UI/UX

- [x] Design cohérent avec le thème
- [x] Animations fluides
- [x] Feedback utilisateur (alertes, loading)
- [x] Gestion d'erreurs
- [x] Accessibilité

### Performance

- [x] Optimisation des re-renders
- [x] Cache des images
- [x] Debounce des sauvegardes
- [x] Compression des images

---

**Fin de la documentation - Page Profile**

*Cette documentation est maintenue à jour avec chaque modification de la page Profile.*










