import { Stack } from "expo-router";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "@/providers/auth";
import { DataProvider } from "@/providers/data";
import { palette } from "@/theme";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.accent,
    background: palette.background,
    card: palette.surface,
    text: palette.ink,
    border: palette.border,
  },
};

function RootNavigator() {
  const { restoring } = useAuth();

  if (restoring) {
    return (
      <View style={{ alignItems: "center", backgroundColor: palette.background, flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.background },
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        headerTintColor: palette.accent,
        headerTitleStyle: { color: palette.ink, fontWeight: "700" },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ title: "Report" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <DataProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
