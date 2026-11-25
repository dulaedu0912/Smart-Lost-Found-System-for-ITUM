import { Typography } from "heroui-native";
import { View } from "react-native";

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
    <View className="gap-2 pt-4">
      <Typography className="uppercase tracking-widest text-accent" type="body-xs" weight="bold">
        {eyebrow}
      </Typography>
      <Typography type="h1" weight="bold">
        {title}
      </Typography>
      {subtitle ? (
        <Typography color="muted" type="body">
          {subtitle}
        </Typography>
      ) : null}
    </View>
  );
}
