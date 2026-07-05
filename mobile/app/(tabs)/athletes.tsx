import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { chatApi } from "@/api/chat";
import { athletesApi } from "@/api/athletes";
import { ApiError } from "@/api/client";
import { Athlete, TimelineEntry } from "@/api/types";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/theme/ThemeContext";
import { ScreenContainer } from "@/components/ScreenContainer";
import { GlassCard } from "@/components/GlassCard";
import { MemoryTimelineList } from "@/components/MemoryTimelineList";

export default function AthletesScreen() {
  const theme = useTheme();
  const toast = useToast();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selected, setSelected] = useState<Athlete | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAthletes = useCallback(async () => {
    try {
      const data = await athletesApi.list();
      setAthletes(data.athletes);
      if (data.athletes.length > 0 && !selected) {
        setSelected(data.athletes[0]);
      }
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Could not load athletes", "error");
    }
  }, [selected, toast]);

  const loadTimeline = useCallback(async (athleteId: string) => {
    setTimelineLoading(true);
    try {
      const data = await chatApi.timeline(athleteId);
      setTimeline(data.entries);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAthletes().finally(() => setLoading(false));
  }, [loadAthletes]);

  useEffect(() => {
    if (selected) loadTimeline(selected.id);
  }, [selected, loadTimeline]);

  async function onRefresh() {
    setRefreshing(true);
    await loadAthletes();
    if (selected) await loadTimeline(selected.id);
    setRefreshing(false);
  }

  function selectAthlete(athlete: Athlete) {
    setSelected(athlete);
    setTimeline([]);
  }

  return (
    <ScreenContainer>
      <FlatList
        data={[1]}
        keyExtractor={() => "main"}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.purpleLight} />}
        contentContainerStyle={styles.scroll}
        renderItem={() => (
          <>
            <Text style={[styles.title, { color: theme.foreground }]}>Athletes</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              {athletes.length} athlete{athletes.length !== 1 ? "s" : ""} accessible
            </Text>

            <View style={{ height: 16 }} />

            {loading ? (
              <Text style={[styles.emptyText, { color: theme.mutedFaint }]}>Loading…</Text>
            ) : athletes.length === 0 ? (
              <GlassCard>
                <Text style={[styles.emptyText, { color: theme.muted }]}>No athletes found</Text>
              </GlassCard>
            ) : (
              <>
                <View style={styles.chipRow}>
                  {athletes.map((a) => (
                    <Pressable
                      key={a.id}
                      onPress={() => selectAthlete(a)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected?.id === a.id ? theme.purple : theme.surface,
                          borderColor: selected?.id === a.id ? theme.purpleLight : theme.surfaceBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected?.id === a.id ? "#fff" : theme.foreground },
                        ]}
                      >
                        {a.name}
                      </Text>
                      <Text
                        style={[
                          styles.chipSport,
                          { color: selected?.id === a.id ? "rgba(255,255,255,0.7)" : theme.muted },
                        ]}
                      >
                        {a.sport}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {selected && (
                  <GlassCard style={{ marginTop: 16 }}>
                    <View style={styles.detailHeader}>
                      <View style={[styles.avatar, { backgroundColor: theme.purple }]}>
                        <Text style={styles.avatarText}>
                          {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.athleteName, { color: theme.foreground }]}>{selected.name}</Text>
                        <Text style={[styles.athleteSport, { color: theme.muted }]}>{selected.sport}</Text>
                      </View>
                      <Ionicons name="person-outline" size={16} color={theme.mutedFaint} />
                    </View>

                    <View style={{ height: 14 }} />

                    <View style={styles.timelineHeader}>
                      <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Memory Timeline</Text>
                      <Text style={[styles.recallTag, { color: theme.cyan }]}>recall()</Text>
                    </View>
                    <View style={{ height: 10 }} />
                    <MemoryTimelineList entries={timeline} loading={timelineLoading} />
                  </GlassCard>
                )}
              </>
            )}
          </>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  emptyText: { fontSize: 13, textAlign: "center", paddingVertical: 20 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { borderWidth: 1, borderRadius: 12, padding: 12, minWidth: "45%", flex: 1 },
  chipText: { fontSize: 13, fontWeight: "700" },
  chipSport: { fontSize: 11, marginTop: 2 },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  athleteName: { fontSize: 16, fontWeight: "700" },
  athleteSport: { fontSize: 12, marginTop: 1, textTransform: "capitalize" },
  timelineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  recallTag: { fontSize: 11, fontWeight: "700", fontFamily: "monospace" },
});
