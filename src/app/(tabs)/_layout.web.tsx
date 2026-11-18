import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@/providers/auth";
import { palette } from "@/theme";

// NativeTabs have no web implementation; web uses the JavaScript tabs.
export default function TabsLayout() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Browse" }} />
      <Tabs.Screen name="report" options={{ title: "Report" }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
