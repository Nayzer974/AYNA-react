# Guide d'installation du template d'email de confirmation

## 📋 Étapes pour configurer dans Supabase

### 1. Accéder aux templates d'email

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** dans le menu de gauche
4. Cliquez sur **Email Templates** (ou **Templates**)

### 2. Sélectionner le template "Confirm signup"

1. Dans la liste des templates, trouvez **"Confirm signup"**
2. Cliquez dessus pour l'éditer

### 3. Copier le template amélioré

1. Ouvrez le fichier `confirmation-email-supabase.html` dans ce dossier
2. Sélectionnez tout le contenu (Ctrl+A / Cmd+A)
3. Copiez-le (Ctrl+C / Cmd+C)

### 4. Coller dans Supabase

1. Dans l'éditeur Supabase, supprimez l'ancien contenu
2. Collez le nouveau template (Ctrl+V / Cmd+V)
3. Vérifiez que la variable `{{ .ConfirmationURL }}` est bien présente
4. Cliquez sur **Save** pour enregistrer

### 5. Tester le template

1. Créez un compte de test dans votre application
2. Vérifiez votre boîte email
3. L'email devrait avoir le nouveau design avec :
   - Header doré avec logo AYNA
   - Message de bienvenue "As-salâmu âlaykum"
   - Bouton de confirmation stylisé
   - Lien alternatif
   - Footer avec liens

## ✅ Vérification

L'email devrait maintenant avoir :
- ✅ Design moderne avec thème AYNA
- ✅ Responsive (mobile-friendly)
- ✅ Bouton de confirmation clair
- ✅ Lien alternatif fonctionnel
- ✅ Note de sécurité

## 🔧 Personnalisation (optionnel)

Si vous voulez modifier les couleurs ou le texte :
1. Modifiez le fichier `confirmation-email-supabase.html`
2. Copiez le nouveau contenu
3. Collez-le dans Supabase Dashboard
4. Sauvegardez

## 📱 Compatibilité

Le template est testé et compatible avec :
- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Web, Desktop)
- ✅ Apple Mail (iOS, macOS)
- ✅ Yahoo Mail
- ✅ Autres clients email modernes






