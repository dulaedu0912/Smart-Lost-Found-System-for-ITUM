import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { EmptyState } from "@/components/empty-state";
import { Hero } from "@/components/hero";
import { MatchCard } from "@/components/match-card";
import { Page } from "@/components/page";
import { useData } from "@/providers/data";
import { spacing } from "@/theme";

export default function AlertsScreen() {
  const { listings, matches, loading, error } = useData();

  const leads = matches.flatMap((match) => {
    const listing = listings.find((item) => item.id === match.candidateId);
    return listing ? [{ match, listing }] : [];
  });

  return (
    <Page>
      <Hero
        eyebrow="MATCH CENTRE"
        subtitle="Ranked by category, zone, date, and description similarity."
        title="Useful leads."
      />
      {leads.length === 0 ? (
        <EmptyState
          message={
            loading
              ? "Looking for campus reports that match yours…"
              : error || "New candidate reports will appear here after matching."
          }
          title={loading ? "Checking matches" : "No strong matches yet"}
        />
      ) : (
        <View style={styles.list}>
          {leads.map(({ match, listing }) => (
            <MatchCard
              key={match.id}
              listing={listing}
              match={match}
              onPress={() =>
                router.push({ pathname: "/listing/[id]", params: { id: listing.id } })
              }
            />
          ))}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
