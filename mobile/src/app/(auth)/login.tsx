import * as Haptics from "expo-haptics";
import { Redirect } from "expo-router";
import { Alert, Typography } from "heroui-native";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  View,
} from "react-native";
import { ApiError, login, register } from "@/api";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { TextField } from "@/components/text-field";
import { useAuth } from "@/providers/auth";

type Mode = "LOGIN" | "REGISTER";

export default function LoginScreen() {
  const { user, setUser } = useAuth();
  const { height } = useWindowDimensions();
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
      <View
        className="flex-1 justify-center px-6"
        style={{
          alignSelf: "center",
          maxWidth: 520,
          paddingVertical: height < 700 ? 16 : 24,
          width: "100%",
        }}
      >
        <View className="mb-5 flex-row items-center gap-3">
          <View className="size-16 items-center justify-center rounded-2xl border border-border bg-surface">
            <Image
              accessibilityLabel="University of Moratuwa emblem"
              resizeMode="contain"
              source={require("../../../assets/uom-logo.png")}
              style={{ height: 52, width: 52 }}
            />
          </View>
          <View className="flex-1">
            <Typography type="body-xs" weight="bold">
              UNIVERSITY OF MORATUWA
            </Typography>
            <Typography color="muted" type="body-xs">
              Institute of Technology
            </Typography>
          </View>
        </View>

        <View className="gap-2">
          <Typography className="text-accent" type="body-xs" weight="bold">
            Lost & found system
          </Typography>
          <Typography type="h1" weight="bold">
            {mode === "LOGIN" ? "Welcome back" : "Create your account"}
          </Typography>
          <Typography color="muted" type="body">
            {mode === "LOGIN"
              ? "Sign in to report lost items and follow matches."
              : "Use your university email to join Smart Campus."}
          </Typography>
        </View>

        <View className="my-4 flex-row gap-2">
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

        <View className="gap-3">
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
            placeholder="studentID@itum.mrt.ac.lk"
            value={email}
          />
          <TextField
            autoCapitalize="none"
            label="Password"
            onChangeText={setPassword}
            onSubmitEditing={submit}
            placeholder="At least 8 characters"
            returnKeyType="done"
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
        </View>
        <Typography align="center" className="mt-3" color="muted" type="body-xs">
          Lost &amp; found support for ITUM students and staff
        </Typography>
      </View>
    </KeyboardAvoidingView>
  );
}
