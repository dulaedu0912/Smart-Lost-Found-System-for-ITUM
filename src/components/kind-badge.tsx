import { StyleSheet, Text, View } from "react-native";
import { ListingKind, ListingStatus } from "@/domain";
import { palette, radius, spacing } from "@/theme";

export function KindBadge({ kind }: { kind: ListingKind }) {
  const lost = kind === "LOST";
  return (
    <View style={[styles.badge, { backgroundColor: lost ? palette.lostSoft : palette.foundSoft }]}>
      <Text style={[styles.badgeText, { color: lost ? palette.lost : palette.found }]}>{kind}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: ListingStatus }) {
  if (status === "ACTIVE") return null;
  return (
    <View style={styles.statusBadge}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  statusBadge: {
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: { color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
});
