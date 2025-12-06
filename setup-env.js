/**
 * Script pour créer le fichier .env
 * 
 * Usage: node setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Contenu par défaut du fichier .env
const defaultEnvContent = `# Configuration Supabase (OBLIGATOIRE)
# Remplacez ces valeurs par vos propres clés Supabase
# Obtenez-les sur https://supabase.com > Settings > API

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_USE_SUPABASE=true

# Configuration API AYNA (optionnel)
EXPO_PUBLIC_AYNA_IFRAME_URL=
EXPO_PUBLIC_AYNA_API_PROXY=

# Configuration OpenRouter (optionnel)
EXPO_PUBLIC_OPENROUTER_API_KEY=
EXPO_PUBLIC_OPENROUTER_SITE_URL=https://ayna.app
EXPO_PUBLIC_OPENROUTER_SITE_NAME=AYNA
EXPO_PUBLIC_OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Configuration Ollama (optionnel)
EXPO_PUBLIC_OLLAMA_API_KEY=

# Configuration API Base (optionnel)
EXPO_PUBLIC_API_BASE_URL=

# Configuration Aladhan (horaires de prière)
EXPO_PUBLIC_ALADHAN_BASE_URL=https://api.aladhan.com/v1

# Configuration Puter (optionnel)
EXPO_PUBLIC_PUTER_BASE_URL=https://js.puter.com/v2/

# Configuration APIs Coran (optionnel)
EXPO_PUBLIC_ALQURAN_API_BASE=https://alquran-api.pages.dev/api
EXPO_PUBLIC_QURANAPI_PAGES_DEV=https://quranapi.pages.dev/api
EXPO_PUBLIC_QURAN_API_BASE=https://apis.quran.foundation/content/api/v4
EXPO_PUBLIC_QURAN_OAUTH_URL=https://oauth2.quran.foundation
EXPO_PUBLIC_QURAN_CLIENT_ID=fe9df116-3b96-4b89-92d9-53afd343c1ac
EXPO_PUBLIC_QURAN_CLIENT_SECRET=ZvlBKxAmYkCr74eBhJVHzBjaqI

# Configuration Dua & Dhikr (optionnel)
EXPO_PUBLIC_DUA_DHIKR_BASE=https://dua-dhikr.onrender.com

# Configuration AlQuran Cloud (optionnel)
EXPO_PUBLIC_ALQURAN_CLOUD_BASE=http://api.alquran.cloud/v1
`;

// Vérifier si .env existe déjà
if (fs.existsSync(envPath)) {
  console.log('⚠️  Le fichier .env existe déjà.');
  console.log('📄 Chemin:', envPath);
  console.log('\nSi vous voulez le recréer, supprimez-le d\'abord.');
  process.exit(0);
}

// Créer le fichier .env
try {
  fs.writeFileSync(envPath, defaultEnvContent, 'utf8');
  console.log('✅ Fichier .env créé avec succès !');
  console.log('📄 Chemin:', envPath);
  console.log('\n📝 Prochaines étapes :');
  console.log('1. Ouvrez le fichier .env');
  console.log('2. Ajoutez vos clés Supabase :');
  console.log('   - EXPO_PUBLIC_SUPABASE_URL');
  console.log('   - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.log('3. Consultez GUIDE_SUPABASE.md pour savoir comment obtenir ces clés');
  console.log('4. Redémarrez Expo : npx expo start --clear');
} catch (error) {
  console.error('❌ Erreur lors de la création du fichier .env:', error.message);
  process.exit(1);
}

