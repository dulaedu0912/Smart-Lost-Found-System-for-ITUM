import { Pressable, StyleSheet, Text, View } from "react-native";
import { Listing, Match } from "@/domain";
import { palette, radius, spacing } from "@/theme";
import { KindBadge } from "./kind-badge";
import { Surface } from "./surface";

export function MatchCard({
  match,
  listing,
  onPress,
}: {
  match: Match;
  listing: Listing;
  onPress: () => void;
}) {
  const score = Math.round(match.score * 100);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open match for ${listing.title}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.score}>{score}%</Text>
          <Text style={styles.scoreLabel}>MATCH</Text>
          <View style={styles.spacer} />
          <KindBadge kind={listing.kind} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {match.summary || `${listing.category} · ${listing.zone}`}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${score}%` }]} />
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88 },
  card: { gap: spacing.sm },
  topRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs + 2 },
  score: { color: palette.found, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  scoreLabel: { color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  spacer: { flex: 1 },
  title: { color: palette.ink, fontSize: 16, fontWeight: "700" },
  meta: { color: palette.body, fontSize: 13.5, lineHeight: 19 },
  track: {
    backgroundColor: palette.accentSoft,
    borderRadius: radius.full,
    height: 6,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  fill: { backgroundColor: palette.accent, borderRadius: radius.full, height: "100%" },
});
