import { router } from "expo-router";
import { useThemeColor, Typography } from "heroui-native";
import { useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { Hero } from "@/components/hero";
import { ListingCard } from "@/components/listing-card";
import { Listing } from "@/domain";
import { useData } from "@/providers/data";

const filters = ["ALL", "LOST", "FOUND"] as const;

export default function BrowseScreen() {
  const { listings, loading, error, refresh } = useData();
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const accent = useThemeColor("accent");
  const visible = listings.filter((listing) => filter === "ALL" || listing.kind === filter);

  function open(listing: Listing) {
    router.push({ pathname: "/listing/[id]", params: { id: listing.id } });
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-12"
      contentInsetAdjustmentBehavior="automatic"
      data={visible}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          onRefresh={() => void refresh()}
          refreshing={loading}
          tintColor={accent}
        />
      }
      ListHeaderComponent={
        <View className="gap-4 pb-4">
          <Hero
            eyebrow="Smart campus"
            subtitle="Browse verified campus reports and help return items to their owners."
            title="Find what matters."
          />
          <Button label="Report an item" onPress={() => router.push("/report")} />
          <View className="flex-row gap-2">
            {filters.map((value) => (
              <Chip
                key={value}
                label={value === "ALL" ? "All reports" : value}
                onPress={() => setFilter(value)}
                selected={filter === value}
              />
            ))}
          </View>
          <Typography type="h5">Recent reports</Typography>
        </View>
      }
      renderItem={({ item }) => <ListingCard listing={item} onPress={() => open(item)} />}
      ItemSeparatorComponent={() => <View className="h-2" />}
      ListEmptyComponent={
        loading ? (
          <Typography align="center" color="muted" className="py-6" type="body-sm">
            Loading the latest campus reports…
          </Typography>
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
