import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { palette, radius, spacing } from "@/theme";

type Variant = "primary" | "secondary" | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pressed.get() ? 0.9 : 1,
    transform: [
      {
        scale: reducedMotion
          ? 1
          : withTiming(pressed.get() ? 0.98 : 1, {
              duration: 120,
              easing: Easing.bezier(0.23, 1, 0.32, 1),
            }),
      },
    ],
  }));

  const variantStyle: ViewStyle =
    variant === "primary"
      ? { backgroundColor: palette.accent }
      : variant === "secondary"
        ? { backgroundColor: palette.accentSoft }
        : { backgroundColor: palette.dangerSoft };

  return (
    <Animated.View style={[animatedStyle, disabled && styles.disabled]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPressIn={() => {
          pressed.set(1);
          void Haptics.selectionAsync();
        }}
        onPressOut={() => pressed.set(0)}
        onPress={onPress}
        style={[styles.button, variantStyle]}
      >
        <Text
          style={[
            styles.label,
            variant === "secondary" && { color: palette.accentInk },
            variant === "danger" && { color: palette.danger },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.md,
    borderCurve: "continuous",
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  label: { color: palette.white, fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.45 },
});
