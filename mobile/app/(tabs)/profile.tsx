import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { chatApi } from "@/api/chat";
import { memoryApi } from "@/api/memory";
import { ApiError } from "@/api/client";
import { DEMO_ATHLETE_ID, DEMO_ATHLETE_NAME } from "@/config/env";
import { TimelineEntry } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/theme/ThemeContext";
import { ScreenContainer } from "@/components/ScreenContainer";
import { GlassCard } from "@/components/GlassCard";
import { MemoryTimelineList } from "@/components/MemoryTimelineList";
import { MetricStat, TrendBars } from "@/components/MetricStat";
import { GradientButton } from "@/components/GradientButton";

const STRIKE_RATE_TREND = [118, 128, 135, 142, 150];
const WEEK_LABELS = ["Wk1", "Wk2", "Wk3", "Wk4", "Wk5"];

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const toast = useToast();
  const theme = useTheme();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadTimeline = useCallback(async () => {
    try {
      const data = await chatApi.timeline(DEMO_ATHLETE_ID);
      setEntries(data.entries);
    } catch (e) {
      if (e instanceof ApiError && !e.isNetworkError) {
        toast.show(e.message, "error");
      }
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    loadTimeline().finally(() => setLoading(false));
  }, [loadTimeline]);

  async function onRefresh() {
    setRefreshing(true);
    await loadTimeline();
    setRefreshing(false);
  }

  async function seedDemo() {
    setSeeding(true);
    try {
      await memoryApi.seedDemo(DEMO_ATHLETE_ID);
      toast.show("Demo memories seeded", "success");
      await loadTimeline();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Could not seed demo memories", "error");
    } finally {
      setSeeding(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const initials = DEMO_ATHLETE_NAME.split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.purpleLight} />}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: theme.purple }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={[styles.name, { color: theme.foreground }]}>{DEMO_ATHLETE_NAME}</Text>
              <Text style={[styles.meta, { color: theme.muted }]}>Cricket · Batsman · Apex United</Text>
              <Text style={[styles.signedIn, { color: theme.mutedFaint }]}>
                Signed in as {session?.fullName ?? session?.email} · {session?.role}
              </Text>
            </View>
          </View>
          <Ionicons
            name="log-out-outline"
            size={22}
            color={theme.muted}
            onPress={handleLogout}
            suppressHighlighting
          />
        </View>

        <GlassCard>
          <View style={styles.statsRow}>
            <MetricStat label="Strike Rate" value="150" delta="+27 (5wk)" accent="purple" />
            <MetricStat label="Sprint Speed" value="28.9 km/h" delta="+6%" accent="cyan" />
            <MetricStat label="Intensity" value="78%" delta="+16pt" accent="emerald" />
          </View>
          <View style={{ height: 16 }} />
          <TrendBars values={STRIKE_RATE_TREND} labels={WEEK_LABELS} accent="purple" />
        </GlassCard>

        <View style={{ height: 20 }} />

        <GlassCard>
          <View style={styles.timelineHeader}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Memory Timeline</Text>
            <Text style={[styles.recallTag, { color: theme.cyan }]}>recall()</Text>
          </View>
          <View style={{ height: 14 }} />
          <MemoryTimelineList entries={entries} loading={loading} />
          {!loading && entries.length === 0 && (
            <GradientButton label="Seed Demo Memories" onPress={seedDemo} loading={seeding} />
          )}
        </GlassCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 0 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  name: { fontSize: 19, fontWeight: "800" },
  meta: { fontSize: 12.5, marginTop: 1 },
  signedIn: { fontSize: 10.5, marginTop: 3 },
  statsRow: { flexDirection: "row", gap: 12 },
  timelineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  recallTag: { fontSize: 11, fontWeight: "700", fontFamily: "monospace" },
});
