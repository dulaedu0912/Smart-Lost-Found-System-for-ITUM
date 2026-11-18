import { Typography } from "heroui-native";
import { View } from "react-native";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View className="items-center gap-2 px-6 py-12">
      <View className="mb-2 h-1.5 w-11 rounded-full bg-accent-soft" />
      <Typography align="center" type="h5">
        {title}
      </Typography>
      <Typography align="center" className="max-w-72" color="muted" type="body-sm">
        {message}
      </Typography>
    </View>
  );
}
