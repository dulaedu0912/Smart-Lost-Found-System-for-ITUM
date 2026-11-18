import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  categories,
  Listing,
  ListingKind,
  Match,
  zones,
} from "./src/domain";
import {
  ApiError,
  AuthUser,
  claimListing,
  createListing as createListingApi,
  getStoredUser,
  listListings,
  listNotifications,
  login,
  register,
  signOut,
  uploadPhoto,
} from "./src/api";
import { palette, radius, spacing } from "./src/theme";

type Screen = "feed" | "report" | "alerts" | "profile" | "detail";

const today = new Date().toISOString().slice(0, 10);

function GlassSurface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.glassSurface, style]}>
      <BlurView intensity={Platform.OS === "ios" ? 42 : 28} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.glassTint}>{children}</View>
    </View>
  );
}

function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pressed.get() ? 0.86 : 1,
    transform: [{ scale: reducedMotion ? 1 : withTiming(pressed.get() ? 0.97 : 1, {
      duration: 120,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
    }) }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          pressed.set(1);
          void Haptics.selectionAsync();
        }}
        onPressOut={() => pressed.set(0)}
        style={[
          styles.button,
          secondary && styles.secondaryButton,
          disabled && styles.disabledButton,
        ]}
      >
        <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.chip, selected && styles.selectedChip]}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ListingRow({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress: () => void;
}) {
  return (
    <GlassSurface style={styles.listingGlass}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${listing.kind === "LOST" ? "Lost" : "Found"} ${listing.title}`}
        onPress={onPress}
        style={styles.listingRow}
      >
        <View style={styles.listingIcon}>
          <Text style={styles.listingIconText}>{listing.kind === "LOST" ? "L" : "F"}</Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.rowBetween}>
            <Text style={styles.listingTitle} numberOfLines={1}>
              {listing.title}
            </Text>
            <Text style={[styles.kind, listing.kind === "FOUND" && styles.foundKind]}>
              {listing.kind}
            </Text>
          </View>
          <Text style={styles.mutedText} numberOfLines={1}>
            {listing.category} · {listing.zone}
          </Text>
          <Text style={styles.captionText} numberOfLines={1}>
            {listing.description}
          </Text>
        </View>
      </Pressable>
    </GlassSurface>
  );
}

function FeedScreen({
  listings,
  onCreate,
  onSelect,
  errorMessage,
  loading,
}: {
  listings: Listing[];
  onCreate: () => void;
  onSelect: (listing: Listing) => void;
  errorMessage?: string;
  loading?: boolean;
}) {
  const [filter, setFilter] = useState<"ALL" | ListingKind>("ALL");
  const visibleListings = listings.filter(
    (listing) => filter === "ALL" || listing.kind === filter,
  );

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={visibleListings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>SMART CAMPUS</Text>
          <Text style={styles.pageTitle}>Find what matters.</Text>
          <Text style={styles.pageSubtitle}>
            Browse verified campus reports and help return items to their owners.
          </Text>
          <Button label="Report an item" onPress={onCreate} />
          {loading ? <Text style={styles.mutedText}>Loading the latest campus reports…</Text> : null}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <View style={styles.chipRow}>
            {(["ALL", "LOST", "FOUND"] as const).map((value) => (
              <Chip
                key={value}
                label={value === "ALL" ? "All reports" : value}
                selected={filter === value}
                onPress={() => setFilter(value)}
              />
            ))}
          </View>
          <Text style={styles.sectionTitle}>Recent reports</Text>
        </View>
      }
      renderItem={({ item }) => <ListingRow listing={item} onPress={() => onSelect(item)} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No reports found</Text>
          <Text style={styles.mutedText}>Try another filter or report an item.</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

function ReportScreen({
  onSubmit,
}: {
  onSubmit: (listing: Listing, privateDetail: string, photoUri?: string) => Promise<void>;
}) {
  const [kind, setKind] = useState<ListingKind>("LOST");
  const [category, setCategory] = useState<string>(categories[0]);
  const [zone, setZone] = useState<string>(zones[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [colour, setColour] = useState("");
  const [privateDetail, setPrivateDetail] = useState("");
  const [photoUri, setPhotoUri] = useState<string>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim() || !description.trim() || !colour.trim() || !privateDetail.trim()) {
      setError("Add a title, description, colour, and private identifying detail.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSubmit(
        {
          id: `listing-${Date.now()}`,
          kind,
          category,
          zone,
          date: today,
          colour: colour.trim(),
          title: title.trim(),
          description: description.trim(),
          status: "ACTIVE",
          ownerName: "You",
        },
        privateDetail.trim(),
        photoUri,
      );
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not publish the report.");
    } finally {
      setSaving(false);
    }

  }

  async function pickPhoto(source: "camera" | "gallery") {
    const permission = source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo access is required to attach an item image.");
      return;
    }
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formContent}
      >
        <Text style={styles.eyebrow}>NEW REPORT</Text>
        <Text style={styles.pageTitle}>Tell the campus.</Text>
        <Text style={styles.pageSubtitle}>
          Structured details help the matching engine surface useful candidates.
        </Text>
        <View style={styles.segmentRow}>
          <Chip label="I lost it" selected={kind === "LOST"} onPress={() => setKind("LOST")} />
          <Chip label="I found it" selected={kind === "FOUND"} onPress={() => setKind("FOUND")} />
        </View>
        <Text style={styles.fieldLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map((value) => (
            <Chip key={value} label={value} selected={category === value} onPress={() => setCategory(value)} />
          ))}
        </ScrollView>
        <Text style={styles.fieldLabel}>Campus zone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {zones.map((value) => (
            <Chip key={value} label={value} selected={zone === value} onPress={() => setZone(value)} />
          ))}
        </ScrollView>
        <Text style={styles.fieldLabel}>Short title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Black Casio calculator" style={styles.input} />
        <Text style={styles.fieldLabel}>Colour</Text>
        <TextInput value={colour} onChangeText={setColour} placeholder="e.g. Black" style={styles.input} />
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Add brand, marks, stickers, or other visible details"
          style={[styles.input, styles.multiline]}
        />
        <Text style={styles.fieldLabel}>Private identifying detail</Text>
        <Text style={styles.helperText}>
          This is hidden from other users and required before a claim is finalized.
        </Text>
        <TextInput
          value={privateDetail}
          onChangeText={setPrivateDetail}
          placeholder="A detail only the genuine owner should know"
          secureTextEntry
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>Photo</Text>
        <View style={styles.photoActions}>
          <Button label={photoUri ? "Photo selected" : "Take photo"} secondary onPress={() => void pickPhoto("camera")} />
          <Button label="Choose from gallery" secondary onPress={() => void pickPhoto("gallery")} />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button label={saving ? "Publishing…" : "Publish report"} onPress={submit} disabled={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AlertsScreen({
  listings,
  matches,
  onSelect,
}: {
  listings: Listing[];
  matches: Match[];
  onSelect: (listing: Listing) => void;
}) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.formContent}>
      <Text style={styles.eyebrow}>MATCH CENTRE</Text>
      <Text style={styles.pageTitle}>Useful leads.</Text>
      <Text style={styles.pageSubtitle}>
        Candidate matches are ranked using category, zone, date, and description similarity.
      </Text>
      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No high-confidence matches yet</Text>
          <Text style={styles.mutedText}>New candidate reports will appear here after matching.</Text>
        </View>
      ) : (
        matches.map((match) => {
          const candidate = listings.find((listing) => listing.id === match.candidateId);
          return (
            <Pressable
              key={match.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${candidate?.title ?? "candidate report"}`}
              onPress={() => (candidate ? onSelect(candidate) : undefined)}
            >
              <GlassSurface style={styles.matchCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.matchScore}>{Math.round(match.score * 100)}% match</Text>
                  <Text style={styles.captionText}>NEW</Text>
                </View>
                <Text style={styles.listingTitle}>{candidate?.title ?? "Candidate report"}</Text>
                <Text style={styles.mutedText}>{match.summary}</Text>
                <Text style={styles.captionText}>
                  Review the item in person before sharing any private details.
                </Text>
              </GlassSurface>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function ListingDetailScreen({
  listing,
  isOwn,
  onClaim,
  onBack,
}: {
  listing: Listing;
  isOwn: boolean;
  onClaim: (privateDetail: string) => Promise<void>;
  onBack: () => void;
}) {
  const [privateDetail, setPrivateDetail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!privateDetail.trim()) {
      setError("Enter the identifying detail to claim this item.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onClaim(privateDetail.trim());
      setPrivateDetail("");
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Could not claim this item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.formContent}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.backLink}>Back to reports</Text>
      </Pressable>
      <Text style={styles.eyebrow}>{listing.kind === "LOST" ? "LOST REPORT" : "FOUND REPORT"}</Text>
      <Text style={styles.pageTitle}>{listing.title}</Text>
      <GlassSurface style={styles.profileCard}>
        <Text style={styles.mutedText}>{listing.category} · {listing.zone}</Text>
        <Text style={styles.mutedText}>{listing.date} · {listing.colour}</Text>
        <Text style={styles.pageSubtitle}>{listing.description}</Text>
        <Text style={styles.captionText}>Reported by {listing.ownerName ?? "a campus user"}</Text>
      </GlassSurface>
      {listing.status !== "ACTIVE" ? (
        <Text style={styles.mutedText}>This item is {listing.status.toLowerCase()}.</Text>
      ) : isOwn ? (
        <Text style={styles.mutedText}>This is your report, so you cannot claim it.</Text>
      ) : (
        <>
          <Text style={styles.fieldLabel}>Private identifying detail</Text>
          <Text style={styles.helperText}>
            Answer the detail recorded by the person who reported this item. You get three attempts.
          </Text>
          <TextInput
            value={privateDetail}
            onChangeText={setPrivateDetail}
            placeholder="Only the genuine owner should know this"
            secureTextEntry
            style={styles.input}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button label={saving ? "Verifying…" : "Claim this item"} onPress={submit} disabled={saving} />
        </>
      )}
    </ScrollView>
  );
}

function ProfileScreen({ listings, user, onSignOut }: { listings: Listing[]; user: AuthUser; onSignOut: () => Promise<void> }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.formContent}>
      <Text style={styles.eyebrow}>YOUR CAMPUS ACCOUNT</Text>
      <Text style={styles.pageTitle}>{user.displayName}</Text>
      <Text selectable style={styles.pageSubtitle}>{user.email}</Text>
      <GlassSurface style={styles.profileCard}>
        <Text style={styles.sectionTitle}>My listings</Text>
        <Text style={styles.mutedText}>{listings.filter((listing) => listing.ownerId === user.id).length} active reports</Text>
        <View style={styles.separator} />
        {listings.filter((listing) => listing.ownerId === user.id).map((listing) => (
          <View key={listing.id} style={styles.rowBetween}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <Text style={styles.status}>{listing.status}</Text>
          </View>
        ))}
      </GlassSurface>
      <Button label="Sign out" secondary onPress={() => void onSignOut()} />
    </ScrollView>
  );
}

function AuthScreen({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@itum.mrt.ac.lk")) {
      setError("Use your @itum.mrt.ac.lk university email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (mode === "REGISTER" && !displayName.trim()) {
      setError("Add your display name to create an account.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const user = mode === "REGISTER"
        ? await register({ email: normalizedEmail, displayName: displayName.trim(), password })
        : await login({ email: normalizedEmail, password });
      onSuccess(user);
    } catch (authError) {
      setError(authError instanceof ApiError ? authError.message : "Authentication failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.authScreen}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.authContent}
      >
        <Text style={styles.eyebrow}>SMART CAMPUS</Text>
        <Text style={styles.pageTitle}>Welcome back.</Text>
        <Text style={styles.pageSubtitle}>
          Sign in with your Institute of Technology University account to report and recover items.
        </Text>
        {mode === "REGISTER" ? (
          <>
            <Text style={styles.fieldLabel}>Display name</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Your name" style={styles.input} />
          </>
        ) : null}
        <Text style={styles.fieldLabel}>University email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="name@itum.mrt.ac.lk"
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry style={styles.input} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button label={saving ? "Connecting…" : mode === "LOGIN" ? "Sign in" : "Create account"} onPress={submit} disabled={saving} />
        <Pressable onPress={() => { setMode(mode === "LOGIN" ? "REGISTER" : "LOGIN"); setError(""); }}>
          <Text style={styles.authSwitch}>
            {mode === "LOGIN" ? "New here? Create an account" : "Already registered? Sign in"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [screen, setScreen] = useState<Screen>("feed");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let active = true;
    getStoredUser()
      .then((stored) => {
        if (!active || !stored) return;
        setUser(stored);
        setAuthenticated(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    setLoadingListings(true);
    Promise.all([listListings(), listNotifications()])
      .then(([loadedListings, loadedMatches]) => {
        if (active) {
          setListings(loadedListings);
          setMatches(loadedMatches);
          setApiError("");
        }
      })
      .catch(async (error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          await signOut();
          if (!active) return;
          setAuthenticated(false);
          setUser(null);
          setListings([]);
          setMatches([]);
          return;
        }
        setApiError(error instanceof Error ? error.message : "Could not load reports.");
      })
      .finally(() => {
        if (active) setLoadingListings(false);
      });
    return () => {
      active = false;
    };
  }, [authenticated]);

  function openListing(listing: Listing) {
    setSelectedListing(listing);
    setScreen("detail");
  }

  async function createListing(listing: Listing, privateDetail: string, photoUri?: string) {
    const photoUrl = photoUri ? await uploadPhoto(photoUri) : undefined;
    const result = await createListingApi({
      kind: listing.kind,
      category: listing.category,
      zone: listing.zone,
      date: listing.date,
      colour: listing.colour,
      title: listing.title,
      description: listing.description,
      privateDetail,
      photoUrl,
    });
    setListings((current) => [...current, result.listing]);
    setMatches((current) => [...current, ...result.matches]);
    setScreen("feed");
  }

  async function handleClaim(privateDetail: string) {
    if (!selectedListing) return;
    await claimListing(selectedListing.id, privateDetail);
    setListings((current) => current.map((listing) => (
      listing.id === selectedListing.id ? { ...listing, status: "CLAIMED" } : listing
    )));
    setSelectedListing({ ...selectedListing, status: "CLAIMED" });
    setMatches((current) => current.filter((match) => (
      match.candidateId !== selectedListing.id && match.listingId !== selectedListing.id
    )));
    listListings().then(setListings).catch(() => undefined);
  }

  async function handleSignOut() {
    await signOut();
    setAuthenticated(false);
    setUser(null);
    setListings([]);
    setMatches([]);
    setSelectedListing(null);
    setScreen("feed");
  }

  if (!authenticated) {
    return (
      <View style={styles.app}>
        <StatusBar style="dark" />
        <AuthScreen onSuccess={(authenticatedUser) => { setUser(authenticatedUser); setAuthenticated(true); }} />
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        {screen === "feed" ? <FeedScreen listings={listings} onCreate={() => setScreen("report")} onSelect={openListing} errorMessage={apiError} loading={loadingListings} /> : null}
        {screen === "report" ? <ReportScreen onSubmit={createListing} /> : null}
        {screen === "alerts" ? <AlertsScreen listings={listings} matches={matches} onSelect={openListing} /> : null}
        {screen === "detail" && selectedListing ? (
          <ListingDetailScreen
            listing={selectedListing}
            isOwn={selectedListing.ownerId === user?.id}
            onClaim={handleClaim}
            onBack={() => setScreen("feed")}
          />
        ) : null}
        {screen === "profile" && user ? <ProfileScreen listings={listings} user={user} onSignOut={handleSignOut} /> : null}
      </View>
      <View style={styles.tabBar}>
        <BlurView
          intensity={Platform.OS === "ios" ? 65 : 28}
          tint={Platform.OS === "ios" ? "systemMaterial" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tabBarContent}>
          {(
            [
              ["feed", "Browse"],
              ["report", "Report"],
              ["alerts", `Alerts${matches.length ? ` ${matches.length}` : ""}`],
              ["profile", "Profile"],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: screen === value }}
              onPress={() => setScreen(value)}
              style={styles.tab}
            >
              <Text style={[styles.tabLabel, screen === value && styles.selectedTabLabel]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: palette.background },
  glassSurface: {
    backgroundColor: "rgba(255,255,255,0.58)",
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  glassTint: { backgroundColor: "rgba(255,255,255,0.18)" },
  screen: { flex: 1 },
  flex: { flex: 1 },
  authScreen: { flex: 1, backgroundColor: palette.background },
  authContent: { flexGrow: 1, justifyContent: "center", padding: spacing.lg, gap: spacing.md },
  authSwitch: { color: palette.accent, fontSize: 14, fontWeight: "700", paddingVertical: spacing.sm, textAlign: "center" },
  backLink: { color: palette.accent, fontSize: 14, fontWeight: "700", paddingVertical: spacing.sm },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  formContent: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  headerBlock: { gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.md },
  eyebrow: { color: palette.accent, fontSize: 12, fontWeight: "700", letterSpacing: 1.4 },
  pageTitle: { color: palette.ink, fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  pageSubtitle: { color: palette.muted, fontSize: 16, lineHeight: 23 },
  sectionTitle: { color: palette.ink, fontSize: 19, fontWeight: "700", marginTop: spacing.sm },
  button: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: radius.md,
    borderCurve: "continuous",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  secondaryButton: { backgroundColor: palette.accentSoft },
  disabledButton: { opacity: 0.45 },
  buttonText: { color: palette.white, fontSize: 16, fontWeight: "700" },
  secondaryButtonText: { color: palette.accent },
  chipRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  selectedChip: { backgroundColor: palette.accent, borderColor: palette.accent },
  chipText: { color: palette.muted, fontSize: 13, fontWeight: "600" },
  selectedChipText: { color: palette.white },
  listingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  listingGlass: { marginBottom: spacing.sm },
  listingIcon: {
    alignItems: "center",
    backgroundColor: palette.accentSoft,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  listingIconText: { color: palette.accent, fontSize: 20, fontWeight: "800" },
  rowBetween: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  listingTitle: { color: palette.ink, flex: 1, fontSize: 16, fontWeight: "700" },
  kind: { color: palette.warning, fontSize: 11, fontWeight: "800" },
  foundKind: { color: palette.success },
  mutedText: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  captionText: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  separator: { backgroundColor: palette.border, height: 1 },
  emptyState: { alignItems: "center", gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { color: palette.ink, fontSize: 17, fontWeight: "700", textAlign: "center" },
  segmentRow: { flexDirection: "row", gap: spacing.sm },
  fieldLabel: { color: palette.ink, fontSize: 14, fontWeight: "700", marginTop: spacing.sm },
  helperText: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  photoActions: { flexDirection: "row", gap: spacing.sm },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 110, textAlignVertical: "top" },
  errorText: { color: "#B42318", fontSize: 14, lineHeight: 20 },
  matchCard: {
    backgroundColor: palette.surface,
    borderColor: palette.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  matchScore: { color: palette.success, fontSize: 14, fontWeight: "800" },
  profileCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    gap: spacing.md,
    padding: spacing.md,
  },
  status: { color: palette.accent, fontSize: 11, fontWeight: "800" },
  tabBar: {
    borderTopColor: "rgba(255,255,255,0.65)",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  tabBarContent: { flexDirection: "row" },
  tab: { alignItems: "center", flex: 1, minHeight: 42, justifyContent: "center" },
  tabLabel: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  selectedTabLabel: { color: palette.accent, fontWeight: "800" },
});
