import { router } from "expo-router";
import { useThemeColor, Typography } from "heroui-native";
import { useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Chip } from "@/components/chip";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { TextField } from "@/components/text-field";
import { Listing } from "@/domain";
import { useData } from "@/providers/data";

const filters = ["ALL", "LOST", "FOUND"] as const;

export default function BrowseScreen() {
  const { listings, loading, error, refresh } = useData();
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const [search, setSearch] = useState("");
  const accent = useThemeColor("accent");
  const query = search.trim().toLowerCase();
  const lostCount = listings.filter((listing) => listing.kind === "LOST").length;
  const foundCount = listings.filter((listing) => listing.kind === "FOUND").length;
  const visible = listings.filter((listing) => {
    if (filter !== "ALL" && listing.kind !== filter) return false;
    if (!query) return true;
    return [listing.title, listing.category, listing.zone, listing.description]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  function open(listing: Listing) {
    router.push({ pathname: "/listing/[id]", params: { id: listing.id } });
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-12"
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
        <View className="pb-5 pt-3">
          <View className="flex-row items-end justify-between gap-4">
            <View className="flex-1 gap-1">
              <Typography className="uppercase tracking-widest text-accent" type="body-xs" weight="bold">
                Smart campus
              </Typography>
              <Typography type="h1" weight="bold">
                Browse
              </Typography>
            </View>
            <View className="mb-1 items-end">
              <Typography align="right" color="muted" type="body-xs">
                {lostCount} lost
              </Typography>
              <Typography align="right" color="muted" type="body-xs">
                {foundCount} found
              </Typography>
            </View>
          </View>

          <View className="mt-5">
            <TextField
              autoCapitalize="none"
              autoCorrect={false}
              label="Search reports"
              onChangeText={setSearch}
              placeholder="Item, category or location"
              returnKeyType="search"
              value={search}
            />
          </View>

          <View className="mt-4 flex-row justify-between gap-2">
            <View className="flex-row gap-2">
              {filters.map((value) => (
                <Chip
                  key={value}
                  label={value === "ALL" ? "All" : value === "LOST" ? "Lost" : "Found"}
                  onPress={() => setFilter(value)}
                  selected={filter === value}
                />
              ))}
            </View>
            <Typography className="self-center" color="muted" type="body-xs" weight="semibold">
              {visible.length} {visible.length === 1 ? "report" : "reports"}
            </Typography>
          </View>

          <View className="mt-5 flex-row items-center justify-between">
            <Typography type="h5" weight="bold">
              Recent reports
            </Typography>
            {visible.length > 0 ? (
              <Typography color="muted" type="body-xs">
                {visible.length} available
              </Typography>
            ) : null}
          </View>
        </View>
      }
      renderItem={({ item }) => <ListingCard listing={item} onPress={() => open(item)} />}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListEmptyComponent={
        loading ? (
          <Typography align="center" color="muted" className="py-6" type="body-sm">
            Loading the latest campus reports…
          </Typography>
        ) : error ? (
          <EmptyState message={error} title="Could not load reports" />
        ) : query ? (
          <EmptyState
            message="Try a different item, category or campus location."
            title="No matching reports"
          />
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
