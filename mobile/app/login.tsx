import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/theme/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { TextField } from "@/components/TextField";
import { ApiError } from "@/api/client";

const QUICK_LOGINS = [
  { label: "Coach · Marcus Chen", email: "coach@nextplay.ai" },
  { label: "Athlete · Rahul Sharma", email: "rahul@nextplay.ai" },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const toast = useToast();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo");
  const [loading, setLoading] = useState(false);

  async function handleLogin(loginEmail?: string) {
    const targetEmail = loginEmail ?? email;
    if (!targetEmail) {
      toast.show("Enter an email to continue", "error");
      return;
    }
    setLoading(true);
    try {
      const session = await login(targetEmail, password || "demo");
      toast.show(`Welcome back, ${session.fullName ?? session.email}`, "success");
      router.replace("/");
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Login failed";
      toast.show(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.purple, theme.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}
          >
            <Text style={styles.logoText}>N</Text>
          </LinearGradient>
          <Text style={[styles.title, { color: theme.foreground }]}>NextPlayAI</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Memory-first athlete intelligence
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <TextField
            label="Email"
            placeholder="coach@nextplay.ai"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <View style={{ height: 14 }} />
          <TextField
            label="Password"
            placeholder="demo"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <View style={{ height: 20 }} />
          <GradientButton label="Log In" loading={loading} onPress={() => handleLogin()} />
        </GlassCard>

        <Text style={[styles.quickLabel, { color: theme.muted }]}>Quick demo access</Text>
        <View style={styles.quickRow}>
          {QUICK_LOGINS.map((q) => (
            <GlassCard key={q.email} style={styles.quickCard}>
              <Text
                onPress={() => {
                  setEmail(q.email);
                  handleLogin(q.email);
                }}
                style={[styles.quickText, { color: theme.foreground }]}
              >
                {q.label}
              </Text>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 20 },
  header: { alignItems: "center", gap: 6, marginBottom: 8 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoText: { color: "#fff", fontSize: 26, fontWeight: "800" },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 13 },
  card: { padding: 20 },
  quickLabel: { fontSize: 12, fontWeight: "600", textAlign: "center", marginTop: 4 },
  quickRow: { flexDirection: "row", gap: 12 },
  quickCard: { flex: 1, padding: 14 },
  quickText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
});
