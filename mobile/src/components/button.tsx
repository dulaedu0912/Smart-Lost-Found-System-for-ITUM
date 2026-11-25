import * as Haptics from "expo-haptics";
import { Button as HeroButton } from "heroui-native";

type Variant = "primary" | "secondary" | "danger";

const heroVariant = {
  primary: "primary",
  secondary: "secondary",
  danger: "danger-soft",
} as const;

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
  return (
    <HeroButton
      isDisabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      size="lg"
      variant={heroVariant[variant]}
    >
      {label}
    </HeroButton>
  );
}
