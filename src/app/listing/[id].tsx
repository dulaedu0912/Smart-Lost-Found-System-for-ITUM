import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { claimListing } from "@/api";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { KindBadge, StatusBadge } from "@/components/kind-badge";
import { Page } from "@/components/page";
import { Surface } from "@/components/surface";
import { TextField } from "@/components/text-field";
import { formatDate } from "@/format";
import { useAuth } from "@/providers/auth";
import { useData } from "@/providers/data";
import { palette, radius, spacing } from "@/theme";

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { listings, refresh } = useData();
  const listing = listings.find((item) => item.id === id);
  const [privateDetail, setPrivateDetail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!listing) {
    return (
      <>
        <Stack.Screen options={{ title: "Report" }} />
        <Page>
          <EmptyState
            message="This report is no longer in the local list. Pull to refresh the feed and try again."
            title="Report unavailable"
          />
        </Page>
      </>
    );
  }

  const isOwn = listing.ownerId === user?.id;

  const submit = async () => {
    if (!privateDetail.trim()) {
      setError("Enter the identifying detail to claim this item.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await claimListing(listing.id, privateDetail.trim());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPrivateDetail("");
      await refresh();
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Could not claim this item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: listing.title }} />
      <Page>
        <View style={styles.titleRow}>
          <KindBadge kind={listing.kind} />
          <StatusBadge status={listing.status} />
        </View>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.lede}>{listing.description}</Text>

        {listing.photoUrl ? (
          <Image resizeMode="cover" source={{ uri: listing.photoUrl }} style={styles.photo} />
        ) : null}

        <Surface style={styles.details}>
          {[
            ["Category", listing.category],
            ["Zone", listing.zone],
            ["Date", formatDate(listing.date)],
            ["Colour", listing.colour],
            ["Reported by", listing.ownerName ?? "Campus user"],
          ].map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text selectable style={styles.detailValue}>
                {value}
              </Text>
            </View>
          ))}
        </Surface>

        {listing.status !== "ACTIVE" ? (
          <Surface style={styles.notice}>
            <Text style={styles.noticeText}>
              This item is {listing.status.toLowerCase()}, so it cannot be claimed.
            </Text>
          </Surface>
        ) : isOwn ? (
          <Surface style={styles.notice}>
            <Text style={styles.noticeText}>
              This is your report. You will be notified when someone claims it.
            </Text>
          </Surface>
        ) : (
          <View style={styles.claim}>
            <Text style={styles.sectionTitle}>Claim this item</Text>
            <TextField
              hint="Answer the detail recorded by the person who reported it. You get three attempts."
              label="Private identifying detail"
              onChangeText={setPrivateDetail}
              placeholder="Only the genuine owner should know this"
              secureTextEntry
              value={privateDetail}
            />
            {error ? (
              <Text selectable style={styles.error}>
                {error}
              </Text>
            ) : null}
            <Button
              disabled={saving}
              label={saving ? "Verifying…" : "Claim this item"}
              onPress={() => void submit()}
            />
          </View>
        )}
      </Page>
    </>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  lede: { color: palette.body, fontSize: 16, lineHeight: 23 },
  photo: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.lg,
    height: 220,
    width: "100%",
  },
  details: { gap: spacing.sm },
  detailRow: { flexDirection: "row", gap: spacing.md },
  detailLabel: { color: palette.muted, fontSize: 13, fontWeight: "600", width: 104 },
  detailValue: { color: palette.ink, flex: 1, fontSize: 14, fontWeight: "700" },
  notice: { backgroundColor: palette.surfaceMuted },
  noticeText: { color: palette.body, fontSize: 14, lineHeight: 20 },
  claim: { gap: spacing.md },
  sectionTitle: {
    color: palette.ink,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: spacing.sm,
  },
  error: { color: palette.danger, fontSize: 14, lineHeight: 20 },
});
