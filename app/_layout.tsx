import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ChelseaMarket_400Regular, useFonts } from '@expo-google-fonts/chelsea-market';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LaunchSplash } from '../src/components/LaunchSplash';
import { getUserProfile } from '../src/db/settingsRepo';
import { AppThemeProvider, useAppTheme } from '../src/theme/ThemeContext';

let launchSplashPlayed = false;

function RootStack() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const [profileChecked, setProfileChecked] = useState(false);
  const [showLaunchSplash, setShowLaunchSplash] = useState(!launchSplashPlayed);
  const navigationTheme = useMemo(() => {
    const baseTheme = theme.isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.expense,
      },
    };
  }, [colors, theme.isDark]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const profile = await getUserProfile();
      if (!alive) return;
      setProfileChecked(true);
      if (!profile && pathname !== '/onboarding') {
        router.replace('/onboarding');
      }
    })();
    return () => { alive = false; };
  }, [pathname, router]);

  const handleLaunchSplashFinish = useCallback(() => {
    launchSplashPlayed = true;
    setShowLaunchSplash(false);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {profileChecked ? (
        <NavigationThemeProvider value={navigationTheme}>
          <BottomSheetModalProvider>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ title: 'Profile', presentation: 'modal' }} />
              <Stack.Screen name="categories/[id]" options={{ title: 'Category', presentation: 'modal' }} />
              <Stack.Screen name="expenses/new" options={{ title: 'Add Expense', presentation: 'modal' }} />
              <Stack.Screen name="expenses/[id]" options={{ title: 'Edit Expense', presentation: 'modal' }} />
            </Stack>
          </BottomSheetModalProvider>
        </NavigationThemeProvider>
      ) : null}
      {showLaunchSplash ? <LaunchSplash ready={profileChecked} onFinish={handleLaunchSplashFinish} /> : null}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ ChelseaMarket_400Regular });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <RootStack />
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
