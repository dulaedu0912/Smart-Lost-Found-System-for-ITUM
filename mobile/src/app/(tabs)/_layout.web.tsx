import { Redirect, Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useAuth } from "@/providers/auth";

// NativeTabs have no web implementation; web uses the JavaScript tabs.
export default function TabsLayout() {
  const { user } = useAuth();
  const [accent, muted, surface, border] = useThemeColor([
    "accent",
    "muted",
    "surface",
    "border",
  ]);

  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
        tabBarStyle: { backgroundColor: surface, borderTopColor: border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Browse" }} />
      <Tabs.Screen name="report" options={{ title: "Report" }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
