import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import { Alert, Card, Typography } from "heroui-native";
import { useState } from "react";
import { Image, View } from "react-native";
import { claimListing } from "@/api";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { KindBadge, StatusBadge } from "@/components/kind-badge";
import { Page } from "@/components/page";
import { TextField } from "@/components/text-field";
import { formatDate } from "@/format";
import { useAuth } from "@/providers/auth";
import { useData } from "@/providers/data";

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
        <View className="flex-row gap-2 pt-4">
          <KindBadge kind={listing.kind} />
          <StatusBadge status={listing.status} />
        </View>
        <Typography type="h2" weight="bold">
          {listing.title}
        </Typography>
        <Typography color="muted" type="body">
          {listing.description}
        </Typography>

        {listing.photoUrl ? (
          <Image
            className="h-56 w-full rounded-3xl bg-surface-secondary"
            resizeMode="cover"
            source={{ uri: listing.photoUrl }}
          />
        ) : null}

        <Card className="gap-3">
          {[
            ["Category", listing.category],
            ["Zone", listing.zone],
            ["Date", formatDate(listing.date)],
            ["Colour", listing.colour],
            ["Reported by", listing.ownerName ?? "Campus user"],
          ].map(([label, value]) => (
            <View key={label} className="flex-row gap-4">
              <Typography className="w-28" color="muted" type="body-sm">
                {label}
              </Typography>
              <Typography className="flex-1" selectable type="body-sm" weight="semibold">
                {value}
              </Typography>
            </View>
          ))}
        </Card>

        {listing.status !== "ACTIVE" ? (
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                This item is {listing.status.toLowerCase()}, so it cannot be claimed.
              </Alert.Title>
            </Alert.Content>
          </Alert>
        ) : isOwn ? (
          <Alert status="accent">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                This is your report. You will be notified when someone claims it.
              </Alert.Title>
            </Alert.Content>
          </Alert>
        ) : (
          <View className="gap-4">
            <Typography type="h5">Claim this item</Typography>
            <TextField
              hint="Answer the detail recorded by the person who reported it. You get three attempts."
              label="Private identifying detail"
              onChangeText={setPrivateDetail}
              placeholder="Only the genuine owner should know this"
              secureTextEntry
              value={privateDetail}
            />
            {error ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Content>
              </Alert>
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
