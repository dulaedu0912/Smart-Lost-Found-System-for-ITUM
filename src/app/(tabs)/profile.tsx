import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Hero } from "@/components/hero";
import { KindBadge } from "@/components/kind-badge";
import { Page } from "@/components/page";
import { Surface } from "@/components/surface";
import { formatDate, initials } from "@/format";
import { useAuth } from "@/providers/auth";
import { useData } from "@/providers/data";
import { palette, radius, spacing } from "@/theme";

export default function ProfileScreen() {
  const { user, signOutUser } = useAuth();
  const { listings, matches } = useData();

  const mine = listings.filter((listing) => listing.ownerId === user?.id);
  const active = mine.filter((listing) => listing.status === "ACTIVE");

  return (
    <Page>
      <Hero eyebrow="YOUR CAMPUS ACCOUNT" title={user?.displayName ?? "Campus user"} />
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.displayName ?? "Campus user")}</Text>
        </View>
        <Text selectable style={styles.email}>
          {user?.email}
        </Text>
      </View>

      <View style={styles.stats}>
        <Surface style={styles.stat}>
          <Text style={styles.statValue}>{active.length}</Text>
          <Text style={styles.statLabel}>Active reports</Text>
        </Surface>
        <Surface style={styles.stat}>
          <Text style={styles.statValue}>{matches.length}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </Surface>
      </View>

      <Text style={styles.sectionTitle}>My reports</Text>
      {mine.length === 0 ? (
        <Surface>
          <Text style={styles.note}>Reports you publish will show up here.</Text>
        </Surface>
      ) : (
        <View style={styles.list}>
          {mine.map((listing) => (
            <Pressable
              accessibilityRole="button"
              key={listing.id}
              onPress={() =>
                router.push({ pathname: "/listing/[id]", params: { id: listing.id } })
              }
            >
              <Surface style={styles.row}>
                <View style={styles.rowBody}>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {listing.title}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {formatDate(listing.date)} · {listing.status}
                  </Text>
                </View>
                <KindBadge kind={listing.kind} />
              </Surface>
            </Pressable>
          ))}
        </View>
      )}

      <Button label="Sign out" onPress={() => void signOutUser()} variant="danger" />
    </Page>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: "center", gap: spacing.sm },
  avatar: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: radius.full,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  avatarText: { color: palette.white, fontSize: 24, fontWeight: "800", letterSpacing: 0.5 },
  email: { color: palette.muted, fontSize: 14 },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: { alignItems: "center", flex: 1, gap: spacing.xs, paddingVertical: spacing.md },
  statValue: {
    color: palette.ink,
    fontSize: 26,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  statLabel: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  sectionTitle: {
    color: palette.ink,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: spacing.sm,
  },
  list: { gap: spacing.sm },
  row: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  rowMeta: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  note: { color: palette.muted, fontSize: 14, lineHeight: 20 },
});
