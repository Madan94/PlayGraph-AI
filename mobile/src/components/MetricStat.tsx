import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

interface MetricStatProps {
  label: string;
  value: string;
  delta?: string;
  accent?: "purple" | "cyan" | "emerald";
}

export function MetricStat({ label, value, delta, accent = "purple" }: MetricStatProps) {
  const theme = useTheme();
  const accentColor = theme[accent];
  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color: theme.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      {delta && <Text style={[styles.delta, { color: accentColor }]}>{delta}</Text>}
    </View>
  );
}

interface TrendBarsProps {
  values: number[];
  labels: string[];
  accent?: "purple" | "cyan" | "emerald";
}

export function TrendBars({ values, labels, accent = "cyan" }: TrendBarsProps) {
  const theme = useTheme();
  const max = Math.max(...values);
  const accentColor = theme[accent];
  return (
    <View style={styles.trendRow}>
      {values.map((v, i) => (
        <View key={i} style={styles.trendCol}>
          <View style={styles.trendTrack}>
            <View
              style={[
                styles.trendBar,
                {
                  height: `${Math.max(8, (v / max) * 100)}%`,
                  backgroundColor: accentColor,
                  opacity: i === values.length - 1 ? 1 : 0.45 + (i / values.length) * 0.4,
                },
              ]}
            />
          </View>
          <Text style={[styles.trendLabel, { color: theme.mutedFaint }]}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 2 },
  value: { fontSize: 20, fontWeight: "800" },
  label: { fontSize: 11, fontWeight: "500" },
  delta: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  trendRow: { flexDirection: "row", alignItems: "flex-end", height: 90, gap: 8 },
  trendCol: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  trendTrack: { width: "100%", height: 64, justifyContent: "flex-end" },
  trendBar: { width: "100%", borderRadius: 5 },
  trendLabel: { fontSize: 9, marginTop: 4 },
});
