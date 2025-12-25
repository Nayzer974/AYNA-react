# Templates d'emails AYNA

## Configuration dans Supabase

Ces templates doivent être configurés dans le Dashboard Supabase :

1. Allez dans **Authentication** → **Email Templates**
2. Sélectionnez le template **Confirm signup**
3. Copiez le contenu du fichier HTML correspondant
4. Collez-le dans l'éditeur de template Supabase

## Templates disponibles

### 1. Confirmation d'inscription - Version Supabase (`confirmation-email-supabase.html`) ⭐ RECOMMANDÉ

**Utilisation** : Email envoyé lors de l'inscription pour confirmer l'adresse email

**Variables Supabase disponibles** :
- `{{ .ConfirmationURL }}` : URL de confirmation unique (utilisée dans le template)
- `{{ .Email }}` : Adresse email de l'utilisateur (optionnel)
- `{{ .SiteURL }}` : URL de base du site (optionnel)

**Caractéristiques** :
- Design moderne avec thème AYNA (couleurs dorées sur fond sombre)
- Responsive (mobile-friendly)
- Bouton de confirmation clair et visible
- Lien alternatif si le bouton ne fonctionne pas
- Note de sécurité avec durée de validité
- Footer avec liens utiles
- Animation subtile sur le header

### 2. Confirmation d'inscription - Version générique (`confirmation-email.html`)

Version générique du template (même design, peut être adaptée pour d'autres systèmes)

**Caractéristiques** :
- Design moderne avec thème AYNA (couleurs dorées sur fond sombre)
- Responsive (mobile-friendly)
- Bouton de confirmation clair
- Lien alternatif si le bouton ne fonctionne pas
- Note de sécurité
- Footer avec liens utiles

### 2. Version texte (`confirmation-email-text.txt`)

Version texte simple pour les clients email qui ne supportent pas HTML.

## Personnalisation

### Couleurs

Les couleurs utilisées correspondent au thème AYNA par défaut :
- **Primary** : `#FFD369` (doré)
- **Accent** : `#FFA500` (orange)
- **Background** : `#0A0F2C` (bleu foncé)
- **Background Secondary** : `#1E1E2F` (gris foncé)

### Modifier les couleurs

Pour adapter aux autres thèmes, modifiez les valeurs dans la section `<style>` :
- `.header` : gradient de fond
- `.confirm-button` : couleur du bouton
- `.logo` et `.greeting` : couleur du texte principal

## Variables Supabase disponibles

Pour les templates d'email Supabase, les variables suivantes sont disponibles :

- `{{ .ConfirmationURL }}` : URL de confirmation
- `{{ .Email }}` : Adresse email de l'utilisateur
- `{{ .Token }}` : Token de confirmation (si nécessaire)
- `{{ .TokenHash }}` : Hash du token (si nécessaire)
- `{{ .SiteURL }}` : URL de base du site

## Notes importantes

1. **Sécurité** : Ne jamais exposer de tokens ou informations sensibles dans l'email
2. **Responsive** : Le template est optimisé pour mobile et desktop
3. **Accessibilité** : Utilise des contrastes suffisants et des tailles de police lisibles
4. **Compatibilité** : Testé sur les principaux clients email (Gmail, Outlook, Apple Mail)

## Test

Pour tester le template :
1. Configurez-le dans Supabase Dashboard
2. Créez un compte de test
3. Vérifiez l'email reçu dans différents clients email

