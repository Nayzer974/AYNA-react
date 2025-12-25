# Guide de Configuration du Logo AYNA

## 📱 Configuration Actuelle

Le logo AYNA utilisé sur l'écran d'accueil est : `assets/images/ayna.png`

## 🔄 Remplacement des Icônes

Pour utiliser le logo AYNA comme icône de l'application, vous devez :

### Option 1 : Copier manuellement (Recommandé)

1. **Ouvrez** `assets/images/ayna.png` dans un éditeur d'images
2. **Créez une version carrée** (1024x1024px) pour l'icône principale
3. **Enregistrez** comme `assets/icon.png`
4. **Créez une version adaptative** (1024x1024px avec fond) pour Android
5. **Enregistrez** comme `assets/adaptive-icon.png`

### Option 2 : Utiliser le logo existant directement

Si le logo `ayna.png` est déjà au bon format, vous pouvez simplement le copier :

```bash
# Depuis le répertoire application
copy assets\images\ayna.png assets\icon.png
copy assets\images\ayna.png assets\adaptive-icon.png
```

## 📐 Spécifications des Icônes

### Icon (iOS et Android)
- **Taille** : 1024x1024px
- **Format** : PNG
- **Fond** : Transparent ou solide
- **Chemin** : `assets/icon.png`

### Adaptive Icon (Android uniquement)
- **Taille** : 1024x1024px
- **Format** : PNG
- **Fond** : Peut avoir un fond (sera utilisé pour l'icône adaptative)
- **Chemin** : `assets/adaptive-icon.png`
- **Couleur de fond** : `#0A0F2C` (définie dans app.config.js)

### Splash Screen
- **Taille** : 1024x1024px (recommandé)
- **Format** : PNG
- **Chemin** : `assets/splash-icon.png`
- **Couleur de fond** : `#0A0F2C`

## ✅ Vérification

Après avoir remplacé les icônes :

1. **Redémarrez Expo** :
   ```bash
   npx expo start --clear
   ```

2. **Vérifiez visuellement** que le logo apparaît correctement

3. **Relancez le build** :
   ```bash
   npm run build:android:preview
   ```

## 🎨 Outils Recommandés

- **GIMP** (gratuit) : Pour redimensionner et ajuster
- **Figma** (gratuit) : Pour créer des versions adaptées
- **Canva** (gratuit) : Pour créer des icônes rapidement

## 📝 Notes

- Le nom de l'application est déjà configuré comme "AYNA" dans `app.config.js`
- Les icônes doivent être carrées (ratio 1:1)
- Pour Android, l'icône adaptative peut avoir un fond qui sera visible autour de l'icône

