import { router } from "expo-router";
import { Avatar, Card, ListGroup, Separator, Typography } from "heroui-native";
import { Fragment } from "react";
import { View } from "react-native";
import { Button } from "@/components/button";
import { Hero } from "@/components/hero";
import { KindBadge } from "@/components/kind-badge";
import { Page } from "@/components/page";
import { formatDate, initials } from "@/format";
import { useAuth } from "@/providers/auth";
import { useData } from "@/providers/data";

export default function ProfileScreen() {
  const { user, signOutUser } = useAuth();
  const { listings, matches } = useData();

  const mine = listings.filter((listing) => listing.ownerId === user?.id);
  const active = mine.filter((listing) => listing.status === "ACTIVE");

  return (
    <Page>
      <Hero eyebrow="Your campus account" title={user?.displayName ?? "Campus user"} />
      <View className="items-center gap-2">
        <Avatar color="accent" size="lg" variant="soft">
          <Avatar.Fallback>{initials(user?.displayName ?? "Campus user")}</Avatar.Fallback>
        </Avatar>
        <Typography color="muted" selectable type="body-sm">
          {user?.email}
        </Typography>
      </View>

      <View className="flex-row gap-2">
        <Card className="flex-1 items-center gap-1 py-4">
          <Typography type="h3" weight="bold">
            {active.length}
          </Typography>
          <Typography color="muted" type="body-xs" weight="medium">
            Active reports
          </Typography>
        </Card>
        <Card className="flex-1 items-center gap-1 py-4">
          <Typography type="h3" weight="bold">
            {matches.length}
          </Typography>
          <Typography color="muted" type="body-xs" weight="medium">
            Matches
          </Typography>
        </Card>
      </View>

      <Typography className="pt-1" type="h5">
        My reports
      </Typography>
      {mine.length === 0 ? (
        <Card>
          <Typography color="muted" type="body-sm">
            Reports you publish will show up here.
          </Typography>
        </Card>
      ) : (
        <ListGroup>
          {mine.map((listing, index) => (
            <Fragment key={listing.id}>
              {index > 0 ? <Separator className="ml-4" /> : null}
              <ListGroup.Item
                onPress={() =>
                  router.push({ pathname: "/listing/[id]", params: { id: listing.id } })
                }
              >
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle numberOfLines={1}>{listing.title}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {formatDate(listing.date)} · {listing.status}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <KindBadge kind={listing.kind} />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </Fragment>
          ))}
        </ListGroup>
      )}

      <Button label="Sign out" onPress={() => void signOutUser()} variant="danger" />
    </Page>
  );
}
