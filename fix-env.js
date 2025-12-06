/**
 * Script pour convertir les variables VITE_* en EXPO_PUBLIC_*
 * et ajouter les variables manquantes pour Expo
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ Le fichier .env n\'existe pas');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const newLines = [];

// Variables à convertir/mapper
const supabaseUrl = lines.find(l => l.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.trim();
const supabaseKey = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.trim();
const useSupabase = lines.find(l => l.startsWith('VITE_USE_SUPABASE='))?.split('=')[1]?.trim();

// Vérifier si les variables EXPO_PUBLIC_ existent déjà
const hasExpoSupabaseUrl = lines.some(l => l.startsWith('EXPO_PUBLIC_SUPABASE_URL='));
const hasExpoSupabaseKey = lines.some(l => l.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY='));

console.log('📝 Analyse du fichier .env...\n');

// Si les variables EXPO_PUBLIC_ n'existent pas, les ajouter
if (!hasExpoSupabaseUrl && supabaseUrl) {
  console.log('✅ Ajout de EXPO_PUBLIC_SUPABASE_URL');
  newLines.push(`EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}`);
}

if (!hasExpoSupabaseKey && supabaseKey) {
  console.log('✅ Ajout de EXPO_PUBLIC_SUPABASE_ANON_KEY');
  newLines.push(`EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}`);
}

if (!lines.some(l => l.startsWith('EXPO_PUBLIC_USE_SUPABASE='))) {
  const useSupabaseValue = useSupabase || 'true';
  console.log('✅ Ajout de EXPO_PUBLIC_USE_SUPABASE');
  newLines.push(`EXPO_PUBLIC_USE_SUPABASE=${useSupabaseValue}`);
}

// Ajouter les nouvelles lignes au fichier
if (newLines.length > 0) {
  // Ajouter une ligne vide si le fichier ne se termine pas par une ligne vide
  if (envContent && !envContent.endsWith('\n')) {
    envContent += '\n';
  }
  
  // Ajouter un commentaire et les nouvelles variables
  envContent += '\n# Variables Expo (ajoutées automatiquement)\n';
  envContent += newLines.join('\n') + '\n';
  
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('\n✅ Fichier .env mis à jour !');
  console.log('\n📋 Variables ajoutées :');
  newLines.forEach(line => console.log(`   ${line}`));
  console.log('\n🔄 Redémarrez Expo : npx expo start --clear');
} else {
  console.log('ℹ️  Les variables EXPO_PUBLIC_* existent déjà ou les valeurs VITE_* sont manquantes');
  console.log('\n📋 Vérifiez que votre .env contient :');
  console.log('   EXPO_PUBLIC_SUPABASE_URL=...');
  console.log('   EXPO_PUBLIC_SUPABASE_ANON_KEY=...');
  console.log('   EXPO_PUBLIC_USE_SUPABASE=true');
}

