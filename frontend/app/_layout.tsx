import React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";

// Keep the native splash visible from cold start until icon fonts register.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'welcome';

    if (!user && !inAuthGroup) {
      // Redirect to welcome if not authenticated
      router.replace('/welcome');
    } else if (user) {
      // Redirect based on role
      if (segments[0] === 'auth' || segments[0] === 'welcome' || segments.length === 0) {
        if (user.role === 'client') {
          router.replace('/(client)/home');
        } else {
          router.replace('/(technician)/home');
        }
      }
    }
  }, [user, isLoading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
