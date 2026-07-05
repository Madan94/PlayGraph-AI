import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { chatApi } from "@/api/chat";
import { memoryApi } from "@/api/memory";
import { reportsApi } from "@/api/reports";
import { ApiError } from "@/api/client";
import { DEMO_ATHLETE_ID, DEMO_ATHLETE_NAME } from "@/config/env";
import { MemoryStats, TimelineEntry } from "@/api/types";
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
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [improving, setImproving] = useState(false);
  const [reporting, setReporting] = useState(false);

  const athleteId = DEMO_ATHLETE_ID;

  const loadTimeline = useCallback(async () => {
    try {
      const data = await chatApi.timeline(athleteId);
      setEntries(data.entries);
    } catch (e) {
      if (e instanceof ApiError && !e.isNetworkError) {
        toast.show(e.message, "error");
      }
    }
  }, [athleteId, toast]);

  const loadStats = useCallback(async () => {
    try {
      const data = await memoryApi.stats();
      setStats(data);
    } catch {
      // stats are optional — don't show error
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTimeline(), loadStats()]).finally(() => setLoading(false));
  }, [loadTimeline, loadStats]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadTimeline(), loadStats()]);
    setRefreshing(false);
  }

  async function seedDemo() {
    setSeeding(true);
    try {
      const result = await memoryApi.seedDemo(athleteId);
      toast.show(`Seeded ${result.memories_seeded} demo memories`, "success");
      await loadTimeline();
      await loadStats();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Could not seed demo memories", "error");
    } finally {
      setSeeding(false);
    }
  }

  async function handleImprove() {
    setImproving(true);
    try {
      await memoryApi.improve(athleteId);
      toast.show("Memory evolution complete", "success");
      await loadTimeline();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Improve failed", "error");
    } finally {
      setImproving(false);
    }
  }

  async function handleReport() {
    setReporting(true);
    try {
      const result = await reportsApi.generate(athleteId);
      toast.show(result.message, "success");
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Report failed", "error");
    } finally {
      setReporting(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const initials = DEMO_ATHLETE_NAME.split(" ")
    .map((n) => n[0])
    .join("");

  const totalOps = stats
    ? Object.values(stats.operations).reduce((a, b) => a + b, 0)
    : null;

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

        {stats && (
          <GlassCard style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Memory Stats</Text>
            <View style={{ height: 10 }} />
            <View style={styles.statsRow}>
              {Object.entries(stats.operations).map(([op, count]) => (
                <View key={op} style={styles.opStat}>
                  <Text style={[styles.opCount, { color: theme.purpleLight }]}>{count}</Text>
                  <Text style={[styles.opLabel, { color: theme.muted }]}>{op}</Text>
                </View>
              ))}
              {totalOps !== null && (
                <View style={styles.opStat}>
                  <Text style={[styles.opCount, { color: theme.cyan }]}>{totalOps}</Text>
                  <Text style={[styles.opLabel, { color: theme.muted }]}>total</Text>
                </View>
              )}
            </View>
          </GlassCard>
        )}

        <View style={{ height: 16 }} />

        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <GradientButton
              label={improving ? "Evolving…" : "Evolve Memory"}
              onPress={handleImprove}
              loading={improving}
              disabled={improving || reporting}
              variant="outline"
            />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <GradientButton
              label={reporting ? "Generating…" : "Generate Report"}
              onPress={handleReport}
              loading={reporting}
              disabled={reporting || improving}
            />
          </View>
        </View>

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
  opStat: { alignItems: "center", flex: 1 },
  opCount: { fontSize: 22, fontWeight: "800" },
  opLabel: { fontSize: 10, marginTop: 2, textTransform: "capitalize" },
  actionRow: { flexDirection: "row" },
});
