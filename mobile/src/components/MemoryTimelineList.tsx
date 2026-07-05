import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TimelineEntry } from "@/api/types";
import { useTheme } from "@/theme/ThemeContext";
import { categorizeMemory } from "@/utils/categorizeMemory";
import { EmptyState } from "./EmptyState";
import { SkeletonTimeline } from "./Skeleton";

interface MemoryTimelineListProps {
  entries: TimelineEntry[];
  loading?: boolean;
  emptyHint?: string;
}

export function MemoryTimelineList({ entries, loading, emptyHint }: MemoryTimelineListProps) {
  const theme = useTheme();

  if (loading) return <SkeletonTimeline />;

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="time-outline"
        title="No memories yet"
        description={emptyHint ?? "Training sessions and coach notes will appear here as they're remembered."}
      />
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry, i) => {
        const meta = categorizeMemory(entry.summary);
        const dotColor = theme[meta.colorKey];
        return (
          <View key={entry.memory_id ?? i} style={styles.row}>
            <View style={styles.railColumn}>
              <View style={[styles.iconDot, { backgroundColor: dotColor + "22", borderColor: dotColor }]}>
                <Ionicons name={meta.icon} size={13} color={dotColor} />
              </View>
              {i < entries.length - 1 && <View style={[styles.rail, { backgroundColor: theme.divider }]} />}
            </View>
            <View style={styles.body}>
              <Text style={[styles.badge, { color: dotColor }]}>{meta.label}</Text>
              <Text style={[styles.summary, { color: theme.foreground }]}>{entry.summary}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0 },
  row: { flexDirection: "row", gap: 12 },
  railColumn: { alignItems: "center", width: 26 },
  iconDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rail: { width: 1.5, flex: 1, marginVertical: 4 },
  body: { flex: 1, paddingBottom: 18 },
  badge: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  summary: { fontSize: 13.5, lineHeight: 19 },
});
