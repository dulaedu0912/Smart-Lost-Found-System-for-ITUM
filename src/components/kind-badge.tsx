import { Chip } from "heroui-native";
import { ListingKind, ListingStatus } from "@/domain";

// LOST reads as caution (amber), FOUND as resolution (green).
export function KindBadge({ kind }: { kind: ListingKind }) {
  const lost = kind === "LOST";
  return (
    <Chip color={lost ? "warning" : "success"} size="sm" variant="soft">
      <Chip.Label>{kind}</Chip.Label>
    </Chip>
  );
}

export function StatusBadge({ status }: { status: ListingStatus }) {
  if (status === "ACTIVE") return null;
  return (
    <Chip color="default" size="sm" variant="secondary">
      <Chip.Label>{status}</Chip.Label>
    </Chip>
  );
}
