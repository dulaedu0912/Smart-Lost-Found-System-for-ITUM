import { router } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { Hero } from "@/components/hero";
import { ListingCard } from "@/components/listing-card";
import { Listing, ListingKind } from "@/domain";
import { useData } from "@/providers/data";
import { palette, spacing } from "@/theme";

export default function BrowseScreen() {
  const { listings, loading, error, refresh } = useData();
  const [filter, setFilter] = useState<"ALL" | ListingKind>("ALL");
  const visible = listings.filter((listing) => filter === "ALL" || listing.kind === filter);

  function open(listing: Listing) {
    router.push({ pathname: "/listing/[id]", params: { id: listing.id } });
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          onRefresh={() => void refresh()}
          refreshing={loading}
          tintColor={palette.accent}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Hero
            eyebrow="SMART CAMPUS"
            subtitle="Browse verified campus reports and help return items to their owners."
            title="Find what matters."
          />
          <Button label="Report an item" onPress={() => router.push("/report")} />
          <View style={styles.chips}>
            {(["ALL", "LOST", "FOUND"] as const).map((value) => (
              <Chip
                key={value}
                label={value === "ALL" ? "All reports" : value}
                onPress={() => setFilter(value)}
                selected={filter === value}
              />
            ))}
          </View>
          <Text style={styles.sectionTitle}>Recent reports</Text>
        </View>
      }
      renderItem={({ item }) => <ListingCard listing={item} onPress={() => open(item)} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        loading ? (
          <Text style={styles.note}>Loading the latest campus reports…</Text>
        ) : error ? (
          <EmptyState message={error} title="Could not load reports" />
        ) : (
          <EmptyState
            message="Try another filter, or report the item you lost or found."
            title="Nothing here yet"
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.md, paddingBottom: spacing.md },
  chips: { flexDirection: "row", gap: spacing.sm },
  sectionTitle: {
    color: palette.ink,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: spacing.xs,
  },
  separator: { height: spacing.sm },
  note: { color: palette.muted, fontSize: 14, paddingVertical: spacing.lg, textAlign: "center" },
});
