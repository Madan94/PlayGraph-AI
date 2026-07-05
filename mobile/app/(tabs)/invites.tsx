import React, { useCallback, useEffect, useState } from "react";
import { Clipboard, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { invitesApi } from "@/api/invites";
import { ApiError } from "@/api/client";
import { CreateInviteResponse, Invite } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/theme/ThemeContext";
import { ScreenContainer } from "@/components/ScreenContainer";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";

export default function InvitesScreen() {
  const { session } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const isCoach = session?.role === "coach";

  // Coach state
  const [invites, setInvites] = useState<Invite[]>([]);
  const [creating, setCreating] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newInvite, setNewInvite] = useState<CreateInviteResponse | null>(null);

  // Athlete state
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const loadInvites = useCallback(async () => {
    if (!isCoach) return;
    setLoadingList(true);
    try {
      const data = await invitesApi.list();
      setInvites(data.invites);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Could not load invites", "error");
    } finally {
      setLoadingList(false);
    }
  }, [isCoach, toast]);

  useEffect(() => { loadInvites(); }, [loadInvites]);

  async function onRefresh() {
    setRefreshing(true);
    await loadInvites();
    setRefreshing(false);
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const result = await invitesApi.create();
      setNewInvite(result);
      toast.show(`Code created: ${result.code}`, "success");
      await loadInvites();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Could not create invite", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleRedeem() {
    if (!code.trim()) return;
    setRedeeming(true);
    try {
      const result = await invitesApi.redeem(code.trim());
      toast.show(result.message ?? "Linked to coach successfully!", "success");
      setCode("");
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Invalid code", "error");
    } finally {
      setRedeeming(false);
    }
  }

  function copyCode(c: string) {
    Clipboard.setString(c);
    toast.show(`Copied: ${c}`, "success");
  }

  function formatExpiry(iso: string | null) {
    if (!iso) return "No expiry";
    const d = new Date(iso);
    return d.toLocaleDateString();
  }

  if (isCoach) {
    return (
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.purpleLight} />}
        >
          <Text style={[styles.title, { color: theme.foreground }]}>Invite Athletes</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Generate invite codes for athletes to link to you</Text>

          <View style={{ height: 20 }} />

          <GradientButton
            label={creating ? "Creating…" : "Generate Invite Code"}
            onPress={handleCreate}
            loading={creating}
            disabled={creating}
          />

          {newInvite && (
            <GlassCard style={{ marginTop: 16 }}>
              <View style={styles.newCodeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.codeLabel, { color: theme.muted }]}>New invite code</Text>
                  <Text style={[styles.codeText, { color: theme.purpleLight }]}>{newInvite.code}</Text>
                  <Text style={[styles.codeMeta, { color: theme.mutedFaint }]}>
                    Expires {formatExpiry(newInvite.expires_at)} · {newInvite.max_uses} uses max
                  </Text>
                </View>
                <Ionicons name="copy-outline" size={20} color={theme.muted} onPress={() => copyCode(newInvite.code)} suppressHighlighting />
              </View>
            </GlassCard>
          )}

          <View style={{ height: 24 }} />

          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            Your Codes {loadingList ? "…" : `(${invites.length})`}
          </Text>
          <View style={{ height: 10 }} />

          {invites.length === 0 && !loadingList ? (
            <GlassCard>
              <Text style={[styles.emptyText, { color: theme.muted }]}>No invite codes yet</Text>
            </GlassCard>
          ) : (
            invites.map((inv) => (
              <GlassCard key={inv.code} style={{ marginBottom: 10 }}>
                <View style={styles.inviteRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.codeText, { color: theme.foreground }]}>{inv.code}</Text>
                    <Text style={[styles.codeMeta, { color: theme.muted }]}>
                      {inv.uses}/{inv.max_uses} uses · expires {formatExpiry(inv.expires_at)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <View style={[styles.usageBadge, { backgroundColor: theme.purple + "33" }]}>
                      <Text style={[styles.usageText, { color: theme.purpleLight }]}>
                        {inv.max_uses - inv.uses} left
                      </Text>
                    </View>
                    <Ionicons name="copy-outline" size={16} color={theme.mutedFaint} onPress={() => copyCode(inv.code)} suppressHighlighting />
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Athlete view — redeem an invite code
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.foreground }]}>Join a Coach</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Enter the invite code your coach shared with you
        </Text>

        <View style={{ height: 24 }} />

        <GlassCard>
          <Text style={[styles.inputLabel, { color: theme.muted }]}>Invite Code</Text>
          <View style={{ height: 8 }} />
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="e.g. XK7P2QM9"
            placeholderTextColor={theme.mutedFaint}
            style={[
              styles.codeInput,
              { color: theme.foreground, backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
            ]}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={16}
          />
          <View style={{ height: 16 }} />
          <GradientButton
            label={redeeming ? "Linking…" : "Redeem Code"}
            onPress={handleRedeem}
            loading={redeeming}
            disabled={redeeming || !code.trim()}
          />
        </GlassCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 12.5, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  emptyText: { fontSize: 13, textAlign: "center", paddingVertical: 16 },
  newCodeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  codeLabel: { fontSize: 11, marginBottom: 4 },
  codeText: { fontSize: 20, fontWeight: "800", letterSpacing: 2, fontFamily: "monospace" },
  codeMeta: { fontSize: 11, marginTop: 4 },
  usageBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  usageText: { fontSize: 11, fontWeight: "700" },
  inputLabel: { fontSize: 12 },
  codeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 3,
    fontFamily: "monospace",
    textAlign: "center",
  },
});
