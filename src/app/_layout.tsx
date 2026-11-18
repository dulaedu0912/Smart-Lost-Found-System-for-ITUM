import "../../global.css";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider, Spinner, useThemeColor } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUniwind } from "uniwind";
import { AuthProvider, useAuth } from "@/providers/auth";
import { DataProvider } from "@/providers/data";
import LoadingScreen from "@/components/LoadingScreen";

function RootNavigator() {
  const { restoring } = useAuth();
  const { theme } = useUniwind();
  const [background, surface, foreground, border, accent] = useThemeColor([
    "background",
    "surface",
    "foreground",
    "border",
    "accent",
  ]);

  const base = theme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = useMemo(
    () => ({
      ...base,
      colors: {
        ...base.colors,
        primary: accent,
        background,
        card: surface,
        text: foreground,
        border,
        notification: accent,
      },
    }),
    [base, accent, background, surface, foreground, border],
  );

  if (restoring) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: background },
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          headerTintColor: accent,
          headerTitleStyle: { color: foreground, fontWeight: "600" },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="listing/[id]" options={{ title: "Report" }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const finishLoading = useCallback(() => setIsLoading(false), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <AuthProvider>
          <DataProvider>
            {isLoading ? (
              <LoadingScreen onAnimationComplete={finishLoading} />
            ) : (
              <RootNavigator />
            )}
          </DataProvider>
        </AuthProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
