export default {
  expo: {
    name: "AYNA",
    slug: "ayna-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0F2C"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ayna.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Cette app a besoin de votre localisation pour calculer la direction de la Qibla.",
        NSLocationAlwaysUsageDescription: "Cette app a besoin de votre localisation pour calculer la direction de la Qibla.",
        NSPhotoLibraryUsageDescription: "Cette app a besoin d'accéder à vos photos pour changer votre avatar.",
        NSPhotoLibraryAddUsageDescription: "Cette app a besoin d'accéder à vos photos pour changer votre avatar."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0F2C"
      },
      package: "com.ayna.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-font",
      "expo-location",
      "expo-sensors",
      "expo-audio"
    ],
    extra: {
      // Variables d'environnement - À remplir depuis .env ou directement ici
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "",
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      useSupabase: process.env.EXPO_PUBLIC_USE_SUPABASE === 'true',
      mindstudioIframeUrl: process.env.EXPO_PUBLIC_AYNA_IFRAME_URL || "",
      mindstudioApiKeyProxy: process.env.EXPO_PUBLIC_AYNA_API_PROXY || "",
      openrouterApiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || "",
      openrouterSiteUrl: process.env.EXPO_PUBLIC_OPENROUTER_SITE_URL || "https://ayna.app",
      openrouterSiteName: process.env.EXPO_PUBLIC_OPENROUTER_SITE_NAME || "AYNA",
      openrouterModel: process.env.EXPO_PUBLIC_OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      ollamaApiKey: process.env.EXPO_PUBLIC_OLLAMA_API_KEY || "",
      aladhanBaseUrl: process.env.EXPO_PUBLIC_ALADHAN_BASE_URL || "https://api.aladhan.com/v1",
      puterBaseUrl: process.env.EXPO_PUBLIC_PUTER_BASE_URL || "https://js.puter.com/v2/",
      alquranApiBaseUrl: process.env.EXPO_PUBLIC_ALQURAN_API_BASE || "https://alquran-api.pages.dev/api",
      quranApiPagesDevBaseUrl: process.env.EXPO_PUBLIC_QURANAPI_PAGES_DEV || "https://quranapi.pages.dev/api",
      quranApiBaseUrl: process.env.EXPO_PUBLIC_QURAN_API_BASE || "https://apis.quran.foundation/content/api/v4",
      quranOAuthUrl: process.env.EXPO_PUBLIC_QURAN_OAUTH_URL || "https://oauth2.quran.foundation",
      quranClientId: process.env.EXPO_PUBLIC_QURAN_CLIENT_ID || "fe9df116-3b96-4b89-92d9-53afd343c1ac",
      quranClientSecret: process.env.EXPO_PUBLIC_QURAN_CLIENT_SECRET || "ZvlBKxAmYkCr74eBhJVHzBjaqI",
      duaDhikrBaseUrl: process.env.EXPO_PUBLIC_DUA_DHIKR_BASE || "https://dua-dhikr.onrender.com",
      alquranCloudBaseUrl: process.env.EXPO_PUBLIC_ALQURAN_CLOUD_BASE || "http://api.alquran.cloud/v1",
    }
  }
};

