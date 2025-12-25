// Configuration d'environnement (React Native / Expo)
import Constants from 'expo-constants';

// Récupérer les variables d'environnement depuis app.config.js (extra)
const extra = Constants.expoConfig?.extra || {};

export const APP_CONFIG = {
  apiBaseUrl: extra.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || "",
  supabaseUrl: extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  useSupabase: extra.useSupabase === true || process.env.EXPO_PUBLIC_USE_SUPABASE === 'true',
  mindstudioIframeUrl: extra.mindstudioIframeUrl || process.env.EXPO_PUBLIC_AYNA_IFRAME_URL || "",
  // ⚠️ SÉCURITÉ : mindstudioApiKeyProxy supprimé - utiliser Supabase Edge Function
  // ⚠️ SÉCURITÉ : openrouterApiKey supprimé - utiliser Supabase Edge Function
  openrouterSiteUrl: extra.openrouterSiteUrl || process.env.EXPO_PUBLIC_OPENROUTER_SITE_URL || "https://nurayna.com",
  openrouterSiteName: extra.openrouterSiteName || process.env.EXPO_PUBLIC_OPENROUTER_SITE_NAME || "AYNA",
  openrouterModel: extra.openrouterModel || process.env.EXPO_PUBLIC_OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
  // ⚠️ SÉCURITÉ : ollamaApiKey supprimé - utiliser Supabase Edge Function
  ollamaUseCloud: true,
  aladhanBaseUrl: extra.aladhanBaseUrl || process.env.EXPO_PUBLIC_ALADHAN_BASE_URL || "https://api.aladhan.com/v1",
  puterBaseUrl: extra.puterBaseUrl || process.env.EXPO_PUBLIC_PUTER_BASE_URL || "https://js.puter.com/v2/",
  alquranApiBaseUrl: extra.alquranApiBaseUrl || process.env.EXPO_PUBLIC_ALQURAN_API_BASE || "https://alquran-api.pages.dev/api",
  quranApiPagesDevBaseUrl: extra.quranApiPagesDevBaseUrl || process.env.EXPO_PUBLIC_QURANAPI_PAGES_DEV || "https://quranapi.pages.dev/api",
  quranApiBaseUrl: extra.quranApiBaseUrl || process.env.EXPO_PUBLIC_QURAN_API_BASE || "https://apis.quran.foundation/content/api/v4",
  quranOAuthUrl: extra.quranOAuthUrl || process.env.EXPO_PUBLIC_QURAN_OAUTH_URL || "https://oauth2.quran.foundation",
  quranClientId: extra.quranClientId || process.env.EXPO_PUBLIC_QURAN_CLIENT_ID || "fe9df116-3b96-4b89-92d9-53afd343c1ac",
  // ⚠️ SÉCURITÉ : quranClientSecret supprimé - utiliser Supabase Edge Function pour OAuth
  duaDhikrBaseUrl: extra.duaDhikrBaseUrl || process.env.EXPO_PUBLIC_DUA_DHIKR_BASE || "https://dua-dhikr.onrender.com",
  // ⚠️ SÉCURITÉ : Forcer HTTPS - HTTP supprimé
  alquranCloudBaseUrl: extra.alquranCloudBaseUrl || process.env.EXPO_PUBLIC_ALQURAN_CLOUD_BASE || "https://api.alquran.cloud/v1",
  useBrevo: extra.useBrevo === true || process.env.EXPO_PUBLIC_USE_BREVO === 'true',
};

export function assertConfig(): void {
  if (!APP_CONFIG.mindstudioIframeUrl) {
    console.warn("EXPO_PUBLIC_AYNA_IFRAME_URL manquant : l'iframe de chat ne sera pas initialisée.");
  }
}

