import { Description, Input, Label, TextField as HeroTextField } from "heroui-native";
import { TextInputProps } from "react-native";

export function TextField({
  label,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <HeroTextField>
      <Label>{label}</Label>
      <Input
        className={props.multiline ? "min-h-28 py-3" : undefined}
        {...props}
        style={style}
        textAlignVertical={props.multiline ? "top" : undefined}
      />
      {hint ? <Description>{hint}</Description> : null}
    </HeroTextField>
  );
}
