import { Card, PressableFeedback, Typography } from "heroui-native";
import { Image, View } from "react-native";
import { Listing } from "@/domain";
import { formatDate } from "@/format";
import { getReportImageSource } from "@/report-images";
import { KindBadge, StatusBadge } from "./kind-badge";

export function ListingCard({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress: () => void;
}) {
  const lost = listing.kind === "LOST";
  const imageSource = getReportImageSource(listing.photoUrl, listing.category);

  return (
    <PressableFeedback
      accessibilityLabel={`${lost ? "Lost" : "Found"} ${listing.title}`}
      accessibilityRole="button"
      onPress={onPress}
    >
      <Card className="flex-row gap-3 rounded-2xl px-4 py-4">
        {imageSource ? (
          <Image
            accessibilityLabel={`${listing.category} report image`}
            className="mt-0.5 h-16 w-16 rounded-xl bg-surface-secondary"
            resizeMode="cover"
            source={imageSource}
          />
        ) : (
          <View
            className={`mt-0.5 size-16 shrink-0 items-center justify-center rounded-xl ${
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
        )}
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-start gap-2">
            <Typography className="flex-1" truncate type="h6">
              {listing.title}
            </Typography>
            <KindBadge kind={listing.kind} />
          </View>
          <Typography className="pr-2" color="muted" numberOfLines={1} type="body-xs" weight="semibold">
            {listing.category} · {listing.zone}
          </Typography>
          <Typography color="muted" numberOfLines={1} type="body-sm">
            {listing.description}
          </Typography>
          <View className="mt-1.5 flex-row items-center border-t border-border pt-2.5">
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
