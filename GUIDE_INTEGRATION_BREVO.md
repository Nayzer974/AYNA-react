# 📧 Guide : Intégration Brevo pour l'envoi d'emails

## 🎯 Objectif

Intégrer Brevo (anciennement Sendinblue) pour l'envoi d'emails transactionnels dans l'application AYNA.

## 📋 Prérequis

1. **Compte Brevo** : Créer un compte sur [https://www.brevo.com](https://www.brevo.com)
2. **Clé API Brevo** : Obtenir votre clé API depuis le dashboard Brevo
3. **Domaine vérifié** : Vérifier votre domaine dans Brevo (optionnel mais recommandé)

## 🔧 Configuration

### Étape 1 : Obtenir la clé API Brevo

1. Allez sur [https://app.brevo.com](https://app.brevo.com)
2. Connectez-vous à votre compte
3. Allez dans **Settings** > **API Keys**
4. Cliquez sur **Generate a new API key**
5. Donnez un nom à votre clé (ex: "AYNA Production")
6. Copiez la clé API (vous ne pourrez la voir qu'une seule fois)

### Étape 2 : Configurer la clé API dans Supabase

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** > **Settings**
4. Dans **Secrets**, ajoutez :
   - **Name** : `BREVO_API_KEY`
   - **Value** : Votre clé API Brevo
5. Cliquez sur **Save**

### Étape 3 : Déployer l'Edge Function

#### Option A : Depuis le Dashboard Supabase

1. Allez dans **Edge Functions**
2. Cliquez sur **Create a new function**
3. Nom : `send-email-brevo`
4. Copiez le contenu de `supabase/functions/send-email-brevo/index.ts`
5. Collez dans l'éditeur
6. Cliquez sur **Deploy**

#### Option B : Depuis la ligne de commande (si Supabase CLI est installé)

```bash
cd application
supabase functions deploy send-email-brevo
```

### Étape 4 : Vérifier le domaine (optionnel mais recommandé)

1. Allez sur [Brevo Dashboard](https://app.brevo.com)
2. Allez dans **Settings** > **Senders & IP**
3. Cliquez sur **Add a domain**
4. Entrez votre domaine (ex: `nurayna.com`)
5. Suivez les instructions pour vérifier le domaine (ajout d'un enregistrement DNS)
6. Une fois vérifié, vous pourrez envoyer des emails depuis `noreply@nurayna.com`

## 🚀 Utilisation

### Dans le code

```typescript
import { 
  sendEmailViaBrevo, 
  sendVerificationEmailViaBrevo,
  sendPasswordResetEmailViaBrevo 
} from '@/services/brevo';

// Envoyer un email de vérification
const result = await sendVerificationEmailViaBrevo(
  'user@example.com',
  'https://www.nurayna.com/verify-email.html?token=...',
  'John Doe'
);

// Envoyer un email de réinitialisation de mot de passe
const result = await sendPasswordResetEmailViaBrevo(
  'user@example.com',
  'https://www.nurayna.com/reset-password.html?token=...',
  'John Doe'
);

// Envoyer un email personnalisé
const result = await sendEmailViaBrevo({
  to: 'user@example.com',
  subject: 'Bienvenue sur AYNA',
  htmlContent: '<h1>Bienvenue !</h1><p>Merci de vous être inscrit.</p>',
  textContent: 'Bienvenue ! Merci de vous être inscrit.',
  tags: ['welcome'],
  from: {
    name: 'AYNA',
    email: 'noreply@nurayna.com',
  },
});
```

## 🔄 Intégration avec le système existant

### Option 1 : Utiliser Brevo en complément de Supabase

Vous pouvez utiliser Brevo pour certains types d'emails tout en gardant Supabase pour l'authentification :

```typescript
// Dans emailVerification.ts
import { sendVerificationEmailViaBrevo } from '@/services/brevo';
import { APP_CONFIG } from '@/config';

export async function sendVerificationEmail(email: string) {
  // Utiliser Brevo si configuré
  if (APP_CONFIG.useBrevo) {
    const verificationLink = generateVerificationLink(email);
    return await sendVerificationEmailViaBrevo(email, verificationLink);
  }
  
  // Sinon, utiliser Supabase
  return await supabase.auth.resend({ type: 'signup', email });
}
```

### Option 2 : Remplacer complètement Supabase par Brevo

Pour remplacer complètement l'envoi d'emails de Supabase par Brevo, vous devrez :

1. Désactiver l'envoi d'emails automatique dans Supabase Dashboard
2. Créer vos propres tokens de vérification
3. Gérer manuellement la vérification d'email

## 📊 Statistiques et Suivi

Brevo fournit des statistiques détaillées sur l'envoi d'emails :

1. Allez sur [Brevo Dashboard](https://app.brevo.com)
2. Allez dans **Statistics** > **Email**
3. Vous verrez :
   - Nombre d'emails envoyés
   - Taux de délivrabilité
   - Taux d'ouverture
   - Taux de clics
   - Bounces et plaintes

## 🎨 Templates d'emails

Brevo permet de créer des templates d'emails réutilisables :

1. Allez dans **Campaigns** > **Email Templates**
2. Cliquez sur **Create a template**
3. Créez votre template avec des variables (ex: `{{name}}`, `{{link}}`)
4. Utilisez le `templateId` dans votre code :

```typescript
await sendEmailViaBrevo({
  to: 'user@example.com',
  templateId: 123,
  params: {
    name: 'John Doe',
    link: 'https://...',
  },
});
```

## 🔒 Sécurité

- ✅ La clé API Brevo est stockée côté serveur (Edge Function)
- ✅ La clé n'est jamais exposée au client
- ✅ Les emails sont envoyés via HTTPS
- ✅ Rate limiting géré par Brevo

## 🐛 Dépannage

### Erreur "BREVO_API_KEY n'est pas configurée"

- Vérifiez que la clé est bien configurée dans Supabase Dashboard > Edge Functions > Settings > Secrets
- Vérifiez que le nom de la variable est exactement `BREVO_API_KEY`

### Erreur "Invalid API key"

- Vérifiez que la clé API est correcte
- Vérifiez que la clé n'a pas expiré
- Régénérez une nouvelle clé si nécessaire

### Les emails ne sont pas délivrés

- Vérifiez les logs dans Brevo Dashboard > Statistics
- Vérifiez que votre domaine est vérifié
- Vérifiez que l'adresse d'expéditeur est valide
- Vérifiez les spams/junk

## 📚 Documentation

- [API Brevo](https://developers.brevo.com/)
- [Documentation Transactional Email](https://developers.brevo.com/api-reference/sendtransacemail)
- [Guide d'intégration](https://developers.brevo.com/guides)

## 💰 Tarification

Brevo offre :
- **Gratuit** : 300 emails/jour
- **Lite** : À partir de 25€/mois pour 10 000 emails/mois
- **Premium** : À partir de 65€/mois pour 20 000 emails/mois

Consultez [https://www.brevo.com/pricing](https://www.brevo.com/pricing) pour plus de détails.

---

**Dernière mise à jour :** 2025-01-27






