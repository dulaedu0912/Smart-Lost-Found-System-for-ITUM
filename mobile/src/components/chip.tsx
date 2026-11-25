import * as Haptics from "expo-haptics";
import { Chip as HeroChip } from "heroui-native";

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
    <HeroChip
      accessibilityState={{ selected }}
      color={selected ? "accent" : "default"}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      size="md"
      variant={selected ? "primary" : "secondary"}
    >
      <HeroChip.Label>{label}</HeroChip.Label>
    </HeroChip>
  );
}
