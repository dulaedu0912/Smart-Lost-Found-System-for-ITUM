import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { createListing as createListingApi, uploadPhoto } from "@/api";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Hero } from "@/components/hero";
import { TextField } from "@/components/text-field";
import { categories, ListingKind, zones } from "@/domain";
import { useData } from "@/providers/data";
import { palette, radius, spacing } from "@/theme";

const today = new Date().toISOString().slice(0, 10);

export default function ReportScreen() {
  const { addListing } = useData();
  const [kind, setKind] = useState<ListingKind>("LOST");
  const [category, setCategory] = useState<string>(categories[0]);
  const [zone, setZone] = useState<string>(zones[0]);
  const [title, setTitle] = useState("");
  const [colour, setColour] = useState("");
  const [description, setDescription] = useState("");
  const [privateDetail, setPrivateDetail] = useState("");
  const [photoUri, setPhotoUri] = useState<string>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function pickPhoto(source: "camera" | "gallery") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo access is required to attach an item image.");
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
            allowsEditing: true,
          });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
  }

  async function submit() {
    if (!title.trim() || !description.trim() || !colour.trim() || !privateDetail.trim()) {
      setError("Add a title, description, colour, and a private identifying detail.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const photoUrl = photoUri ? await uploadPhoto(photoUri) : undefined;
      const result = await createListingApi({
        kind,
        category,
        zone,
        date: today,
        colour: colour.trim(),
        title: title.trim(),
        description: description.trim(),
        privateDetail: privateDetail.trim(),
        photoUrl,
      });
      addListing(result.listing, result.matches);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not publish the report.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Hero
          eyebrow="NEW REPORT"
          subtitle="Structured details help the matching engine surface useful candidates."
          title="Tell the campus."
        />

        <View style={styles.kindRow}>
          <Chip label="I lost it" onPress={() => setKind("LOST")} selected={kind === "LOST"} />
          <Chip label="I found it" onPress={() => setKind("FOUND")} selected={kind === "FOUND"} />
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Category</Text>
          <ScrollView
            contentContainerStyle={styles.chips}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {categories.map((value) => (
              <Chip
                key={value}
                label={value}
                onPress={() => setCategory(value)}
                selected={category === value}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Campus zone</Text>
          <ScrollView
            contentContainerStyle={styles.chips}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {zones.map((value) => (
              <Chip key={value} label={value} onPress={() => setZone(value)} selected={zone === value} />
            ))}
          </ScrollView>
        </View>

        <TextField
          label="Short title"
          onChangeText={setTitle}
          placeholder="e.g. Black Casio calculator"
          value={title}
        />
        <TextField
          label="Colour"
          onChangeText={setColour}
          placeholder="e.g. Black"
          value={colour}
        />
        <TextField
          hint="Add brand, marks, stickers, or other visible details."
          label="Description"
          multiline
          onChangeText={setDescription}
          placeholder="What does the item look like?"
          value={description}
        />
        <TextField
          hint="Hidden from other users. Required before a claim is finalised."
          label="Private identifying detail"
          onChangeText={setPrivateDetail}
          placeholder="A detail only the genuine owner should know"
          secureTextEntry
          value={privateDetail}
        />

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Photo</Text>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}
          <View style={styles.photoActions}>
            <Button
              label={photoUri ? "Retake photo" : "Take photo"}
              onPress={() => void pickPhoto("camera")}
              variant="secondary"
            />
            <Button
              label="Choose from gallery"
              onPress={() => void pickPhoto("gallery")}
              variant="secondary"
            />
          </View>
          {photoUri ? (
            <Pressable accessibilityRole="button" onPress={() => setPhotoUri(undefined)}>
              <Text style={styles.removePhoto}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <Text selectable style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Button
          disabled={saving}
          label={saving ? "Publishing…" : "Publish report"}
          onPress={() => void submit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.background, flex: 1 },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  kindRow: { flexDirection: "row", gap: spacing.sm },
  group: { gap: spacing.sm },
  groupLabel: { color: palette.ink, fontSize: 14, fontWeight: "700" },
  chips: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.md },
  preview: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    height: 180,
    width: "100%",
  },
  photoActions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  removePhoto: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: "700",
    paddingVertical: spacing.xs,
  },
  error: { color: palette.danger, fontSize: 14, lineHeight: 20 },
});
