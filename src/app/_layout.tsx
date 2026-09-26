import '@/services/crypto/cryptoPolyfill';
import '@/services/i18n';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { installNetworkBlocker } from '@/services/network/networkBlocker';

// Enforce 100% offline air-gapped zero-network perimeter immediately at application startup
installNetworkBlocker();

// Prevent splash screen from auto-hiding before UI layout is ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

