import { Card, PressableFeedback, Typography } from "heroui-native";
import { View } from "react-native";
import { Listing, Match } from "@/domain";
import { KindBadge } from "./kind-badge";

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
    <PressableFeedback
      accessibilityLabel={`Open match for ${listing.title}`}
      accessibilityRole="button"
      onPress={onPress}
    >
      <Card className="gap-2">
        <View className="flex-row items-center gap-2">
          <Typography className="text-accent" type="h4" weight="bold">
            {score}%
          </Typography>
          <Typography className="uppercase tracking-wider" color="muted" type="body-xs" weight="bold">
            match
          </Typography>
          <View className="flex-1" />
          <KindBadge kind={listing.kind} />
        </View>
        <Typography truncate type="h6">
          {listing.title}
        </Typography>
        <Typography color="muted" numberOfLines={2} type="body-sm">
          {match.summary || `${listing.category} · ${listing.zone}`}
        </Typography>
        <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-accent-soft">
          <View className="h-full rounded-full bg-accent" style={{ width: `${score}%` }} />
        </View>
      </Card>
      <PressableFeedback.Highlight className="rounded-3xl" />
    </PressableFeedback>
  );
}
