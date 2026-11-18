import { Pressable, StyleSheet, Text, View } from "react-native";
import { Listing } from "@/domain";
import { formatDate } from "@/format";
import { palette, spacing } from "@/theme";
import { KindBadge, StatusBadge } from "./kind-badge";
import { Surface } from "./surface";

export function ListingCard({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress: () => void;
}) {
  const lost = listing.kind === "LOST";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lost ? "Lost" : "Found"} ${listing.title}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface style={styles.card}>
        <View style={[styles.glyph, { backgroundColor: lost ? palette.lostSoft : palette.foundSoft }]}>
          <Text style={[styles.glyphText, { color: lost ? palette.lost : palette.found }]}>
            {lost ? "L" : "F"}
          </Text>
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {listing.title}
            </Text>
            <KindBadge kind={listing.kind} />
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {listing.category} · {listing.zone}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {listing.description}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.date}>{formatDate(listing.date)}</Text>
            <StatusBadge status={listing.status} />
          </View>
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88 },
  card: { flexDirection: "row", gap: spacing.md },
  glyph: {
    alignItems: "center",
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  glyphText: { fontSize: 19, fontWeight: "800" },
  body: { flex: 1, gap: spacing.xs },
  titleRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  title: { color: palette.ink, flex: 1, fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  meta: { color: palette.muted, fontSize: 13, fontWeight: "600" },
  description: { color: palette.body, fontSize: 14, lineHeight: 20 },
  footer: { alignItems: "center", flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  date: { color: palette.muted, flex: 1, fontSize: 12, fontWeight: "600" },
});
