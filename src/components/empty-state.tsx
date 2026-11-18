import { StyleSheet, Text, View } from "react-native";
import { palette, spacing } from "@/theme";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.mark} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  mark: {
    backgroundColor: palette.accentSoft,
    borderRadius: 14,
    height: 6,
    marginBottom: spacing.sm,
    width: 44,
  },
  title: { color: palette.ink, fontSize: 18, fontWeight: "800", textAlign: "center" },
  message: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 300,
    textAlign: "center",
  },
});
