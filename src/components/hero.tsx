import { StyleSheet, Text, View } from "react-native";
import { palette, spacing } from "@/theme";

export function Hero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingTop: spacing.md },
  eyebrow: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: {
    color: palette.ink,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.9,
    lineHeight: 40,
  },
  subtitle: { color: palette.body, fontSize: 16, lineHeight: 23 },
});
