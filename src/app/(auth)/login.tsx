import * as Haptics from "expo-haptics";
import { Redirect } from "expo-router";
import { Alert, Typography } from "heroui-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { ApiError, login, register } from "@/api";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { TextField } from "@/components/text-field";
import { useAuth } from "@/providers/auth";

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
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center gap-4 p-6"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-2 size-14 items-center justify-center rounded-2xl bg-accent">
          <Typography className="text-accent-foreground" type="h5" weight="bold">
            SC
          </Typography>
        </View>
        <Typography className="uppercase tracking-widest text-accent" type="body-xs" weight="bold">
          Smart campus
        </Typography>
        <Typography type="h1" weight="bold">
          {mode === "LOGIN" ? "Welcome back." : "Join the campus."}
        </Typography>
        <Typography color="muted" type="body">
          {mode === "LOGIN"
            ? "Sign in to report lost items, follow matches, and claim what is yours."
            : "Create an account with your university email to start reporting."}
        </Typography>

        <View className="my-2 flex-row gap-2">
          <Chip
            label="Sign in"
            onPress={() => {
              setMode("LOGIN");
              setError("");
            }}
            selected={mode === "LOGIN"}
          />
          <Chip
            label="Create account"
            onPress={() => {
              setMode("REGISTER");
              setError("");
            }}
            selected={mode === "REGISTER"}
          />
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
          label={saving ? "Connecting…" : mode === "LOGIN" ? "Sign in" : "Create account"}
          onPress={submit}
        />
        <Typography align="center" className="mt-2" color="muted" type="body-xs">
          Lost &amp; found for the Institute of Technology, University of Moratuwa.
        </Typography>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
