import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, BookOpen, BarChart2, Book, User } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { createNavigationTheme } from '@/theme/navigationTheme';
import { useTranslation } from 'react-i18next';

// Import des pages
import { Home } from '@/pages/Home';
import { Journal } from '@/pages/Journal';
import { Chat } from '@/pages/Chat';
import { Analytics } from '@/pages/Analytics';
import { Quran } from '@/pages/Quran';
import { Profile } from '@/pages/Profile';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { QuranReader } from '@/pages/QuranReader';
import { BaytAnNur } from '@/pages/BaytAnNur';
import { UmmAyna } from '@/pages/UmmAyna';
import { NurShifa } from '@/pages/NurShifa';
import { DairatAnNur } from '@/pages/DairatAnNur';
import { AsmaUlHusna } from '@/pages/AsmaUlHusna';
import { QiblaPage } from '@/pages/QiblaPage';
import { Settings } from '@/pages/Settings';
import { ResetPassword } from '@/pages/ResetPassword';
import { Challenge40Days } from '@/pages/Challenge40Days';
import { AdminBans } from '@/pages/AdminBans';
import { KhalwaStats } from '@/pages/KhalwaStats';
import { Healing } from '@/pages/Healing';
import { RequireAuth } from '@/components/RequireAuth';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundSecondary || '#1E1E2F',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        },
        tabBarActiveTintColor: theme.colors.accent || '#FFA500',
        tabBarInactiveTintColor: theme.colors.textSecondary || 'rgba(255, 255, 255, 0.6)',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => <HomeIcon size={size || 24} color={color} />,
          tabBarLabel: t('nav.home'),
        }}
      />
      <Tab.Screen 
        name="Journal" 
        options={{
          tabBarIcon: ({ color, size }) => <BookOpen size={size || 24} color={color} />,
          tabBarLabel: t('nav.journal'),
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
        component={Quran}
        options={{
          tabBarIcon: ({ color, size }) => <Book size={size || 24} color={color} />,
          tabBarLabel: t('nav.quran'),
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        options={{
          tabBarIcon: ({ color, size }) => <BarChart2 size={size || 24} color={color} />,
          tabBarLabel: t('nav.analytics'),
        }}
      >
        {() => (
          <RequireAuth>
            <Analytics />
          </RequireAuth>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Profile" 
        options={{
          tabBarIcon: ({ color, size }) => <User size={size || 24} color={color} />,
          tabBarLabel: t('nav.profile'),
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

export function AppNavigator() {
  const userContext = useUser();
  const user = userContext?.user;
  const customTheme = getTheme(user?.theme || 'default');
  
  // Créer un thème de navigation complet avec fonts pour éviter l'erreur
  // "Cannot read property 'medium' of undefined"
  const navigationTheme = createNavigationTheme(customTheme);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Animation de transition pour les changements de page
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
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
            <RequireAuth>
              <Chat />
            </RequireAuth>
          )}
        </Stack.Screen>
        <Stack.Screen name="QuranReader" component={QuranReader} />
        <Stack.Screen name="AsmaUlHusna" component={AsmaUlHusna} />
        <Stack.Screen name="QiblaPage" component={QiblaPage} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="BaytAnNur" component={BaytAnNur} />
        <Stack.Screen name="Sabilanur">
          {() => (
            <RequireAuth>
              <Challenge40Days />
            </RequireAuth>
          )}
        </Stack.Screen>
        <Stack.Screen name="UmmAyna" component={UmmAyna} />
        <Stack.Screen name="NurShifa" component={NurShifa} />
        <Stack.Screen name="DairatAnNur">
          {() => (
            <RequireAuth>
              <DairatAnNur />
            </RequireAuth>
          )}
        </Stack.Screen>
        <Stack.Screen name="Challenge40Days">
          {() => (
            <RequireAuth>
              <Challenge40Days />
            </RequireAuth>
          )}
        </Stack.Screen>
        <Stack.Screen name="AdminBans">
          {() => (
            <RequireAuth>
              <AdminBans />
            </RequireAuth>
          )}
        </Stack.Screen>
        <Stack.Screen name="KhalwaStats" component={KhalwaStats} />
        <Stack.Screen name="Healing" component={Healing} />
        {/* Pages d'authentification toujours disponibles */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

