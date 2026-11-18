import * as Haptics from "expo-haptics";
import { Redirect } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, login, register } from "@/api";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { TextField } from "@/components/text-field";
import { useAuth } from "@/providers/auth";
import { palette, radius, spacing } from "@/theme";

type Mode = "LOGIN" | "REGISTER";

export default function LoginScreen() {
  const { user, setUser } = useAuth();
  const [mode, setMode] = useState<Mode>("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (user) return <Redirect href="/" />;

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
      const account =
        mode === "REGISTER"
          ? await register({
              email: normalizedEmail,
              displayName: displayName.trim(),
              password,
            })
          : await login({ email: normalizedEmail, password });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(account);
    } catch (authError) {
      setError(
        authError instanceof ApiError
          ? authError.message
          : "Authentication failed. Try again.",
      );
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.brandMark}>
          <Text style={styles.brandText}>SC</Text>
        </View>
        <Text style={styles.eyebrow}>SMART CAMPUS</Text>
        <Text style={styles.title}>
          {mode === "LOGIN" ? "Welcome back." : "Join the campus."}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "LOGIN"
            ? "Sign in to report lost items, follow matches, and claim what is yours."
            : "Create an account with your university email to start reporting."}
        </Text>

        <View style={styles.modeRow}>
          <Chip label="Sign in" selected={mode === "LOGIN"} onPress={() => { setMode("LOGIN"); setError(""); }} />
          <Chip label="Create account" selected={mode === "REGISTER"} onPress={() => { setMode("REGISTER"); setError(""); }} />
        </View>

        {mode === "REGISTER" ? (
          <TextField
            autoCapitalize="words"
            label="Display name"
            onChangeText={setDisplayName}
            placeholder="Your name"
            value={displayName}
          />
        ) : null}

        <TextField
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="University email"
          onChangeText={setEmail}
          placeholder="name@itum.mrt.ac.lk"
          value={email}
        />
        <TextField
          autoCapitalize="none"
          label="Password"
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          value={password}
        />

        {error ? <Text selectable style={styles.error}>{error}</Text> : null}

        <Button
          disabled={saving}
          label={saving ? "Connecting…" : mode === "LOGIN" ? "Sign in" : "Create account"}
          onPress={submit}
        />
        <Text style={styles.note}>
          Lost & found for the Institute of Technology, University of Moratuwa.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.background, flex: 1 },
  content: {
    flexGrow: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: radius.md,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 56,
  },
  brandText: { color: palette.white, fontSize: 20, fontWeight: "800", letterSpacing: 0.5 },
  eyebrow: { color: palette.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: palette.ink, fontSize: 34, fontWeight: "800", letterSpacing: -0.9 },
  subtitle: { color: palette.body, fontSize: 16, lineHeight: 23 },
  modeRow: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.sm },
  error: { color: palette.danger, fontSize: 14, lineHeight: 20 },
  note: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
