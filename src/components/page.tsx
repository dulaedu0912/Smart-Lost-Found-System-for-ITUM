import { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { palette, spacing } from "@/theme";

export function Page({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={styles.page}
      contentContainerStyle={styles.content}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: palette.background, flex: 1 },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
