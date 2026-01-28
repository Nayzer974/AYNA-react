import React, { Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, BookOpen, User, ScrollText } from 'lucide-react-native';
import { QuranIcon } from '@/components/icons/QuranIcon';
import { View, Easing, ActivityIndicator, Text } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { createNavigationTheme } from '@/theme/navigationTheme';
import { useTranslation } from 'react-i18next';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';
import { useSpaceAudio } from '@/contexts/SpaceAudioContext';

// Import des pages principales (chargées immédiatement)
import { Home } from '@/pages/Home';
import { Journal } from '@/pages/Journal';
import { Quran } from '@/pages/Quran';
import { Profile } from '@/pages/Profile';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { RiyadAsSalihin } from '@/pages/RiyadAsSalihin';

// Lazy loading des pages secondaires
const VerifyEmail = React.lazy(() => import('@/pages/VerifyEmail').then(module => ({ default: module.VerifyEmail })));
const Chat = React.lazy(() => import('@/pages/Chat').then(module => ({ default: module.Chat })));
const ForgotPassword = React.lazy(() => import('@/pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const QuranReader = React.lazy(() => import('@/pages/QuranReader').then(module => ({ default: module.QuranReader })));
const BaytAnNur = React.lazy(() => import('@/pages/BaytAnNur').then(module => ({ default: module.BaytAnNur })));
const UmmAyna = React.lazy(() => import('@/pages/UmmAyna').then(module => ({ default: module.UmmAyna })));
const NurShifa = React.lazy(() => import('@/pages/NurShifa').then(module => ({ default: module.NurShifa })));
const NurQuranParcours21 = React.lazy(() => import('@/pages/NurQuranParcours21').then(module => ({ default: module.NurQuranParcours21 })));
const NurQuranLumiere = React.lazy(() => import('@/pages/NurQuranLumiere').then(module => ({ default: module.NurQuranLumiere })));
const NurAfiyahPage = React.lazy(() => import('@/pages/NurAfiyahPage').then(module => ({ default: module.NurAfiyahPage })));
const DairatAnNur = React.lazy(() => import('@/pages/DairatAnNur').then(module => ({ default: module.DairatAnNur })));
const AsmaUlHusna = React.lazy(() => import('@/pages/AsmaUlHusna').then(module => ({ default: module.AsmaUlHusna })));
const QiblaPage = React.lazy(() => import('@/pages/QiblaPage').then(module => ({ default: module.QiblaPage })));
const Settings = React.lazy(() => import('@/pages/Settings').then(module => ({ default: module.Settings })));
const ResetPassword = React.lazy(() => import('@/pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const ChangePassword = React.lazy(() => import('@/pages/ChangePassword').then(module => ({ default: module.ChangePassword })));
const Challenge40Days = React.lazy(() => import('@/pages/Challenge40Days').then(module => ({ default: module.Challenge40Days })));
const AdminBans = React.lazy(() => import('@/pages/AdminBans').then(module => ({ default: module.AdminBans })));
const KhalwaStats = React.lazy(() => import('@/pages/KhalwaStats').then(module => ({ default: module.KhalwaStats })));
const Healing = React.lazy(() => import('@/pages/Healing').then(module => ({ default: module.Healing })));
const Analytics = React.lazy(() => import('@/pages/Analytics').then(module => ({ default: module.Analytics })));
const ThemeCreator = React.lazy(() => import('@/pages/ThemeCreator').then(module => ({ default: module.ThemeCreator })));
const WidgetsSettings = React.lazy(() => import('@/pages/WidgetsSettings').then(module => ({ default: module.WidgetsSettings })));
const HomeWidgetsSettings = React.lazy(() => import('@/pages/HomeWidgetsSettings').then(module => ({ default: module.HomeWidgetsSettings })));
const ShortcutsSettings = React.lazy(() => import('@/pages/ShortcutsSettings').then(module => ({ default: module.ShortcutsSettings })));
const BookmarksPage = React.lazy(() => import('@/pages/BookmarksPage').then(module => ({ default: module.BookmarksPage })));
// RiyadAsSalihin est maintenant importé directement (onglet principal)

import { RequireAuth } from '@/components/RequireAuth';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Composant de chargement minimal
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F2C' }}>
    <ActivityIndicator size="large" color="#FFD369" />
  </View>
);

// ✅ FIX : Wrapper Suspense - Suppression du timeout bloquant
// Problème identifié : timeout de 3s trop court, s'affichait même si chargement réussissait
// Solution : Laisser Suspense gérer le chargement normalement
// Suspense ne bloque jamais indéfiniment - il attend que le module soit chargé
// Sur Expo Go, le chargement peut prendre 5-10 secondes, c'est normal
const LazyScreen = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  );
};

// ✅ FIX : Wrappers pour composants lazy avec Suspense correctement géré
// Ces wrappers permettent à React Navigation d'utiliser la prop 'component' au lieu de children
const ChatWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <Chat />
    </RequireAuth>
  </LazyScreen>
);

const QuranReaderWrapper = () => (
  <LazyScreen>
    <QuranReader />
  </LazyScreen>
);

const AsmaUlHusnaWrapper = () => (
  <LazyScreen>
    <AsmaUlHusna />
  </LazyScreen>
);

const QiblaPageWrapper = () => (
  <LazyScreen>
    <QiblaPage />
  </LazyScreen>
);

const SettingsWrapper = () => (
  <LazyScreen>
    <Settings />
  </LazyScreen>
);

const ResetPasswordWrapper = () => (
  <LazyScreen>
    <ResetPassword />
  </LazyScreen>
);

const ChangePasswordWrapper = () => (
  <LazyScreen>
    <ChangePassword />
  </LazyScreen>
);

const BaytAnNurWrapper = () => (
  <LazyScreen>
    <BaytAnNur />
  </LazyScreen>
);

const Challenge40DaysWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <Challenge40Days />
    </RequireAuth>
  </LazyScreen>
);

const UmmAynaWrapper = () => (
  <LazyScreen>
    <UmmAyna />
  </LazyScreen>
);

const NurShifaWrapper = () => (
  <LazyScreen>
    <NurShifa />
  </LazyScreen>
);

const NurQuranParcours21Wrapper = () => (
  <LazyScreen>
    <NurQuranParcours21 />
  </LazyScreen>
);

const NurQuranLumiereWrapper = () => (
  <LazyScreen>
    <NurQuranLumiere />
  </LazyScreen>
);

const NurAfiyahPageWrapper = () => (
  <LazyScreen>
    <NurAfiyahPage />
  </LazyScreen>
);

const DairatAnNurWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <DairatAnNur />
    </RequireAuth>
  </LazyScreen>
);

const AdminBansWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <AdminBans />
    </RequireAuth>
  </LazyScreen>
);

const KhalwaStatsWrapper = () => (
  <LazyScreen>
    <KhalwaStats />
  </LazyScreen>
);

const HealingWrapper = () => (
  <LazyScreen>
    <Healing />
  </LazyScreen>
);

const AnalyticsWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <Analytics />
    </RequireAuth>
  </LazyScreen>
);

const ThemeCreatorWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <ThemeCreator />
    </RequireAuth>
  </LazyScreen>
);

const WidgetsSettingsWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <WidgetsSettings />
    </RequireAuth>
  </LazyScreen>
);

const HomeWidgetsSettingsWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <HomeWidgetsSettings />
    </RequireAuth>
  </LazyScreen>
);

const ShortcutsSettingsWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <ShortcutsSettings />
    </RequireAuth>
  </LazyScreen>
);

const BookmarksPageWrapper = () => (
  <LazyScreen>
    <RequireAuth>
      <BookmarksPage />
    </RequireAuth>
  </LazyScreen>
);

const VerifyEmailWrapper = () => (
  <LazyScreen>
    <VerifyEmail />
  </LazyScreen>
);

const ForgotPasswordWrapper = () => (
  <LazyScreen>
    <ForgotPassword />
  </LazyScreen>
);

// Type pour la navigation des tabs
type MainTabsParamList = {
  Home: undefined;
  Journal: undefined;
  Quran: undefined;
  Hadith: undefined;
  Profile: undefined;
};


function MainTabs() {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();


  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent || '#FFA500',
        tabBarInactiveTintColor: theme.colors.textSecondary || 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'System',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <HomeIcon size={size || 24} color={color} />
          ),
          tabBarLabel: t('nav.home'),
          tabBarAccessibilityLabel: 'Home',
        }}
      >
        {() => <Home />}
      </Tab.Screen>
      <Tab.Screen
        name="Journal"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <BookOpen size={size || 24} color={color} />
          ),
          tabBarLabel: t('nav.journal'),
          tabBarAccessibilityLabel: 'Journal',
        }}
      >
        {() => (
          <RequireAuth>
            <Journal />
          </RequireAuth>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Quran"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <QuranIcon size={size || 24} color={color} />
          ),
          tabBarLabel: t('nav.quran'),
          tabBarAccessibilityLabel: 'Quran',
        }}
      >
        {() => <Quran />}
      </Tab.Screen>
      <Tab.Screen
        name="Hadith"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <ScrollText size={size || 24} color={color} />
          ),
          tabBarLabel: t('nav.hadith') || 'Hadith',
          tabBarAccessibilityLabel: 'Hadith',
        }}
      >
        {() => <RiyadAsSalihin />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <User size={size || 24} color={color} />
          ),
          tabBarLabel: t('nav.profile'),
          tabBarAccessibilityLabel: 'Profile',
        }}
      >
        {() => (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export const AppNavigator = React.forwardRef<any, {}>((props, ref) => {
  const userContext = useUser();
  const user = userContext?.user;
  const customTheme = getTheme(user?.theme || 'default');
  const { onNavigationStateChange } = useSpaceAudio();

  // Créer un thème de navigation complet avec fonts pour éviter l'erreur
  // "Cannot read property 'medium' of undefined"
  const navigationTheme = createNavigationTheme(customTheme);

  return (
    <NavigationContainer ref={ref} theme={navigationTheme} onStateChange={onNavigationStateChange}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Animation de transition optimisée pour les changements de page
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 150,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 100,
                easing: Easing.bezier(0.4, 0.0, 0.6, 1),
              },
            },
          },
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
                opacity: current.progress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.5, 1],
                }),
              },
            };
          },
        }}
      >
        {/* Toujours afficher les tabs principales, même sans authentification */}
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Chat" component={ChatWrapper} />
        <Stack.Screen name="QuranReader" component={QuranReaderWrapper} />
        <Stack.Screen name="AsmaUlHusna" component={AsmaUlHusnaWrapper} />
        <Stack.Screen name="QiblaPage" component={QiblaPageWrapper} />
        <Stack.Screen name="Settings" component={SettingsWrapper} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordWrapper} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordWrapper} />
        <Stack.Screen name="BaytAnNur" component={BaytAnNurWrapper} />
        <Stack.Screen name="Sabilanur" component={Challenge40DaysWrapper} />
        <Stack.Screen name="UmmAyna" component={UmmAynaWrapper} />
        <Stack.Screen name="NurShifa" component={NurShifaWrapper} />
        <Stack.Screen name="NurQuranParcours21" component={NurQuranParcours21Wrapper} />
        <Stack.Screen name="NurQuranLumiere" component={NurQuranLumiereWrapper} />
        <Stack.Screen name="NurAfiyahPage" component={NurAfiyahPageWrapper} />
        <Stack.Screen name="DairatAnNur" component={DairatAnNurWrapper} />
        <Stack.Screen name="AdminBans" component={AdminBansWrapper} />
        <Stack.Screen name="KhalwaStats" component={KhalwaStatsWrapper} />
        <Stack.Screen name="Healing" component={HealingWrapper} />
        <Stack.Screen name="Analytics" component={AnalyticsWrapper} />
        <Stack.Screen name="ThemeCreator" component={ThemeCreatorWrapper} />
        <Stack.Screen name="WidgetsSettings" component={WidgetsSettingsWrapper} />
        <Stack.Screen name="HomeWidgetsSettings" component={HomeWidgetsSettingsWrapper} />
        <Stack.Screen name="ShortcutsSettings" component={ShortcutsSettingsWrapper} />
        <Stack.Screen name="BookmarksPage" component={BookmarksPageWrapper} />
        {/* Pages d'authentification toujours disponibles */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailWrapper} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordWrapper} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

