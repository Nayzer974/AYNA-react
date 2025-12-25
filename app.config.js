export default {
  expo: {
    name: "AYNA",
    slug: "ayna-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    scheme: "ayna",
    owner: "bl4ck00",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0F2C"
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
        "POST_NOTIFICATIONS",
        "RECORD_AUDIO",
        "CAMERA"
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      jsEngine: "hermes",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "ayna",
              host: "dhikr",
              pathPrefix: "/invite"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        },
        {
          action: "VIEW",
          data: [
            {
              scheme: "ayna",
              host: "auth",
              pathPrefix: "/callback"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        },
        {
          action: "VIEW",
          data: [
            { scheme: "ayna", host: "subscription-success", pathPrefix: "/" },
            { scheme: "ayna", host: "subscription-cancel", pathPrefix: "/" }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ayna.app",
      jsEngine: "hermes",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Cette app a besoin de votre localisation pour calculer la direction de la Qibla.",
        NSLocationAlwaysUsageDescription: "Cette app a besoin de votre localisation pour calculer la direction de la Qibla.",
        NSPhotoLibraryUsageDescription: "Cette app a besoin d'accéder à vos photos pour changer votre avatar.",
        NSPhotoLibraryAddUsageDescription: "Cette app a besoin d'accéder à vos photos pour changer votre avatar.",
        NSCameraUsageDescription: "Cette app a besoin d'accéder à l'appareil photo pour prendre une photo de profil.",
        NSMicrophoneUsageDescription: "Cette app a besoin du micro pour enregistrer des messages vocaux.",
        NSUserNotificationsUsageDescription: "Cette app a besoin de notifications pour vous rappeler les heures de prière et vos moments spirituels.",
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ["ayna"],
            CFBundleURLName: "com.ayna.app"
          }
        ]
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-font",
      "expo-location",
      "expo-sensors",
      "expo-audio",
      "expo-asset",
      "expo-image-picker",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#0A0F2C",
          sounds: []
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "c2832911-1e2c-4175-a93b-c61fdbbd2575"
      },
      // Variables d'environnement - ⚠️ SÉCURITÉ : Ne jamais hardcoder les secrets ici
      // Pour le développement local, créer un fichier .env à la racine du projet
      // Pour les builds EAS, utiliser: eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "votre_url"
      // 
      // ⚠️ IMPORTANT : Ajouter .env au .gitignore pour éviter de commiter les secrets
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "",
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      // default true, allow disabling with EXPO_PUBLIC_USE_SUPABASE=false
      useSupabase: process.env.EXPO_PUBLIC_USE_SUPABASE === 'false' ? false : true,
      mindstudioIframeUrl: process.env.EXPO_PUBLIC_AYNA_IFRAME_URL || "",
      // ⚠️ SÉCURITÉ : mindstudioApiKeyProxy supprimé - utiliser Supabase Edge Function
      // ⚠️ SÉCURITÉ : openrouterApiKey supprimé - utiliser Supabase Edge Function
      openrouterSiteUrl: process.env.EXPO_PUBLIC_OPENROUTER_SITE_URL || "https://ayna.app",
      openrouterSiteName: process.env.EXPO_PUBLIC_OPENROUTER_SITE_NAME || "AYNA",
      openrouterModel: process.env.EXPO_PUBLIC_OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      // ⚠️ SÉCURITÉ : ollamaApiKey supprimé - utiliser Supabase Edge Function
      aladhanBaseUrl: process.env.EXPO_PUBLIC_ALADHAN_BASE_URL || "https://api.aladhan.com/v1",
      puterBaseUrl: process.env.EXPO_PUBLIC_PUTER_BASE_URL || "https://js.puter.com/v2/",
      alquranApiBaseUrl: process.env.EXPO_PUBLIC_ALQURAN_API_BASE || "https://alquran-api.pages.dev/api",
      quranApiPagesDevBaseUrl: process.env.EXPO_PUBLIC_QURANAPI_PAGES_DEV || "https://quranapi.pages.dev/api",
      quranApiBaseUrl: process.env.EXPO_PUBLIC_QURAN_API_BASE || "https://apis.quran.foundation/content/api/v4",
      quranOAuthUrl: process.env.EXPO_PUBLIC_QURAN_OAUTH_URL || "https://oauth2.quran.foundation",
      quranClientId: process.env.EXPO_PUBLIC_QURAN_CLIENT_ID || "",
      // ⚠️ SÉCURITÉ : quranClientSecret supprimé - utiliser Supabase Edge Function pour OAuth
      duaDhikrBaseUrl: process.env.EXPO_PUBLIC_DUA_DHIKR_BASE || "https://dua-dhikr.onrender.com",
      alquranCloudBaseUrl: process.env.EXPO_PUBLIC_ALQURAN_CLOUD_BASE || "https://api.alquran.cloud/v1",
      useBrevo: process.env.EXPO_PUBLIC_USE_BREVO === 'true' || false,
    }
  }
};

