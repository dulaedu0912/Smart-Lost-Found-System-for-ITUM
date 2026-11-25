import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, listListings, listNotifications } from "@/api";
import { Listing, Match } from "@/domain";
import { useAuth } from "@/providers/auth";

type DataContextValue = {
  listings: Listing[];
  matches: Match[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addListing: (listing: Listing, matches: Match[]) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, signOutUser } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedListings, loadedMatches] = await Promise.all([
        listListings(),
        listNotifications(),
      ]);
      setListings(loadedListings);
      setMatches(loadedMatches);
      setError("");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await signOutUser();
        return;
      }
      setError(
        requestError instanceof Error ? requestError.message : "Could not load reports.",
      );
    } finally {
      setLoading(false);
    }
  }, [signOutUser]);

  useEffect(() => {
    // The signed-out screens render no cached data, and the next sign-in refreshes everything.
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for the initial fetch
    void refresh();
  }, [user, refresh]);

  const addListing = useCallback((listing: Listing, newMatches: Match[]) => {
    setListings((current) => [listing, ...current]);
    setMatches((current) => [...newMatches, ...current]);
  }, []);

  const value = useMemo(
    () => ({ listings, matches, loading, error, refresh, addListing }),
    [listings, matches, loading, error, refresh, addListing],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside DataProvider");
  return context;
}
