import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: theme.surfaceBorder, opacity: pulse },
        style,
      ]}
    />
  );
}

export function SkeletonTimeline() {
  return (
    <View style={styles.timelineWrap}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.timelineRow}>
          <Skeleton width={8} height={8} borderRadius={4} style={{ marginTop: 6 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton height={12} width="90%" />
            <Skeleton height={12} width="60%" />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  timelineWrap: { gap: 16 },
  timelineRow: { flexDirection: "row", gap: 10 },
});
