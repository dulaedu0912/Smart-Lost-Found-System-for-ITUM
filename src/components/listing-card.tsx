import { Card, PressableFeedback, Typography } from "heroui-native";
import { View } from "react-native";
import { Listing } from "@/domain";
import { formatDate } from "@/format";
import { KindBadge, StatusBadge } from "./kind-badge";

export function ListingCard({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress: () => void;
}) {
  const lost = listing.kind === "LOST";

  return (
    <PressableFeedback
      accessibilityLabel={`${lost ? "Lost" : "Found"} ${listing.title}`}
      accessibilityRole="button"
      onPress={onPress}
    >
      <Card className="flex-row gap-3">
        <View
          className={`size-12 items-center justify-center rounded-2xl ${
            lost ? "bg-warning-soft" : "bg-success-soft"
          }`}
        >
          <Typography
            className={lost ? "text-warning-soft-foreground" : "text-success-soft-foreground"}
            type="h5"
            weight="bold"
          >
            {lost ? "L" : "F"}
          </Typography>
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Typography className="flex-1" truncate type="h6">
              {listing.title}
            </Typography>
            <KindBadge kind={listing.kind} />
          </View>
          <Typography color="muted" type="body-xs" weight="semibold">
            {listing.category} · {listing.zone}
          </Typography>
          <Typography color="muted" numberOfLines={2} type="body-sm">
            {listing.description}
          </Typography>
          <View className="mt-1 flex-row items-center gap-2">
            <Typography className="flex-1" color="muted" type="body-xs">
              {formatDate(listing.date)}
            </Typography>
            <StatusBadge status={listing.status} />
          </View>
        </View>
      </Card>
      <PressableFeedback.Highlight className="rounded-3xl" />
    </PressableFeedback>
  );
}
