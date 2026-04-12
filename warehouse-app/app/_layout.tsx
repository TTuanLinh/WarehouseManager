import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

function SplashGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SplashGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen
              name="login"
              options={{
                headerShown: true,
                title: 'Đăng nhập',
                headerBackTitle: 'Trở lại',
              }}
            />
            <Stack.Screen
              name="register"
              options={{
                headerShown: true,
                title: 'Đăng ký',
                headerBackTitle: 'Trở lại',
              }}
            />
            <Stack.Screen name="(app)" />
          </Stack>
        </SplashGate>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
