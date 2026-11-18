import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { palette, radius, spacing } from "@/theme";

export function TextField({
  label,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        placeholderTextColor={palette.muted}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[styles.input, props.multiline && styles.multiline, focused && styles.focused, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs + 2 },
  label: { color: palette.ink, fontSize: 14, fontWeight: "700" },
  hint: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  multiline: { minHeight: 112, textAlignVertical: "top" },
  focused: { borderColor: palette.accent },
});
