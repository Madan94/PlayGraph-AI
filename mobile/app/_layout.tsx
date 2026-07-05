import React, { useCallback, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { isRestoring } = useAuth();
  const theme = useTheme();

  const onLayout = useCallback(async () => {
    if (!isRestoring) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [isRestoring]);

  useEffect(() => {
    onLayout();
  }, [onLayout]);

  if (isRestoring) return null;

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
