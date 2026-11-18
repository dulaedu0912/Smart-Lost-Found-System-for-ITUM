import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text } from "react-native";
import { palette, radius, spacing } from "@/theme";

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
  },
  selected: { backgroundColor: palette.accent, borderColor: palette.accent },
  pressed: { backgroundColor: palette.surfaceMuted },
  label: { color: palette.body, fontSize: 13, fontWeight: "700" },
  selectedLabel: { color: palette.white },
});
