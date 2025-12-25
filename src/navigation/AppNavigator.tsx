import React, { Suspense, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, BookOpen, Book, User } from 'lucide-react-native';
import { View, ActivityIndicator, Easing as RNEasing } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { createNavigationTheme } from '@/theme/navigationTheme';
import { useTranslation } from 'react-i18next';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

// Import des pages principales (chargées immédiatement)
import { Home } from '@/pages/Home';
import { Journal } from '@/pages/Journal';
import { Quran } from '@/pages/Quran';
import { Profile } from '@/pages/Profile';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';

// Lazy loading des pages secondaires
const VerifyEmail = React.lazy(() => import('@/pages/VerifyEmail').then(module => ({ default: module.VerifyEmail })));
const Chat = React.lazy(() => import('@/pages/Chat').then(module => ({ default: module.Chat })));
const ForgotPassword = React.lazy(() => import('@/pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const QuranReader = React.lazy(() => import('@/pages/QuranReader').then(module => ({ default: module.QuranReader })));
const BaytAnNur = React.lazy(() => import('@/pages/BaytAnNur').then(module => ({ default: module.BaytAnNur })));
const UmmAyna = React.lazy(() => import('@/pages/UmmAyna').then(module => ({ default: module.UmmAyna })));
const NurShifa = React.lazy(() => import('@/pages/NurShifa').then(module => ({ default: module.NurShifa })));
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

import { RequireAuth } from '@/components/RequireAuth';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Composant de chargement animé et engageant
const LoadingScreen = () => {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    // Rotation continue
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    
    // Scale pulsant
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Opacité pulsante
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.6, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <Animated.View style={animatedStyle}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </Animated.View>
    </View>
  );
};

// Wrapper pour Suspense avec lazy loading
const LazyScreen = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingScreen />}>
    {children}
  </Suspense>
);

// Type pour la navigation des tabs
type MainTabsParamList = {
  Home: undefined;
  Journal: undefined;
  Quran: undefined;
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
          ...({ tabBarTestID: 'Home' } as any),
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
          ...({ tabBarTestID: 'Journal' } as any),
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
            <Book size={size || 24} color={color} />
          ),
          tabBarLabel: t('nav.quran'),
          tabBarAccessibilityLabel: 'Quran',
          ...({ tabBarTestID: 'Quran' } as any),
        }}
      >
        {() => <Quran />}
      </Tab.Screen>
      <Tab.Screen 
        name="Profile" 
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <User size={size || 24} color={color} />
          ),
          tabBarLabel: t('nav.profile'),
          tabBarAccessibilityLabel: 'Profile',
          ...({ tabBarTestID: 'Profile' } as any),
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
  
  // Créer un thème de navigation complet avec fonts pour éviter l'erreur
  // "Cannot read property 'medium' of undefined"
  const navigationTheme = createNavigationTheme(customTheme);

  return (
    <NavigationContainer ref={ref} theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Animation de transition pour les changements de page
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 250,
                easing: RNEasing.bezier(0.4, 0.0, 0.2, 1),
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 200,
                easing: RNEasing.bezier(0.4, 0.0, 0.6, 1),
              },
            },
          },
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                  {
                    scale: next
                      ? next.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.9],
                        })
                      : 1,
                  },
                ],
                opacity: current.progress.interpolate({
                  inputRange: [0, 0.5, 0.9, 1],
                  outputRange: [0, 0.25, 0.7, 1],
                }),
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            };
          },
        }}
      >
        {/* Toujours afficher les tabs principales, même sans authentification */}
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Chat">
          {() => (
            <LazyScreen>
              <RequireAuth>
                <Chat />
              </RequireAuth>
            </LazyScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="QuranReader">
          {() => <LazyScreen><QuranReader /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="AsmaUlHusna">
          {() => <LazyScreen><AsmaUlHusna /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="QiblaPage">
          {() => <LazyScreen><QiblaPage /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {() => <LazyScreen><Settings /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="ResetPassword">
          {() => <LazyScreen><ResetPassword /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="ChangePassword">
          {() => <LazyScreen><ChangePassword /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="BaytAnNur">
          {() => <LazyScreen><BaytAnNur /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="Sabilanur">
          {() => (
            <LazyScreen>
              <RequireAuth>
                <Challenge40Days />
              </RequireAuth>
            </LazyScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="UmmAyna">
          {() => <LazyScreen><UmmAyna /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="NurShifa">
          {() => <LazyScreen><NurShifa /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="DairatAnNur">
          {() => (
            <LazyScreen>
              <RequireAuth>
                <DairatAnNur />
              </RequireAuth>
            </LazyScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="AdminBans">
          {() => (
            <LazyScreen>
              <RequireAuth>
                <AdminBans />
              </RequireAuth>
            </LazyScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="KhalwaStats">
          {() => <LazyScreen><KhalwaStats /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="Healing">
          {() => <LazyScreen><Healing /></LazyScreen>}
        </Stack.Screen>
        <Stack.Screen name="Analytics">
          {() => (
            <LazyScreen>
              <RequireAuth>
                <Analytics />
              </RequireAuth>
            </LazyScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="ThemeCreator">
          {() => (
            <LazyScreen>
              <RequireAuth>
                <ThemeCreator />
              </RequireAuth>
            </LazyScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="WidgetsSettings">
          {() => (
            <LazyScreen>
              <RequireAuth>
                <WidgetsSettings />
              </RequireAuth>
            </LazyScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="HomeWidgetsSettings">
          {() => (
            <LazyScreen>
              <RequireAuth>
                <HomeWidgetsSettings />
              </RequireAuth>
            </LazyScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="ShortcutsSettings">
          {() => (
            <LazyScreen>
              <RequireAuth>
                <ShortcutsSettings />
              </RequireAuth>
            </LazyScreen>
          )}
        </Stack.Screen>
        {/* Pages d'authentification toujours disponibles */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="VerifyEmail">
          {() => (
            <LazyScreen>
              <VerifyEmail />
            </LazyScreen>
          )}
        </Stack.Screen>
        <Stack.Screen name="ForgotPassword">
          {() => <LazyScreen><ForgotPassword /></LazyScreen>}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
});

