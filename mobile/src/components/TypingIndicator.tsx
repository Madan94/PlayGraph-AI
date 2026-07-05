import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

function Dot({ delay }: { delay: number }) {
  const theme = useTheme();
  const value = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0.3, duration: 350, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value, delay]);

  return <Animated.View style={[styles.dot, { backgroundColor: theme.muted, opacity: value }]} />;
}

export function TypingIndicator() {
  const theme = useTheme();
  return (
    <View style={[styles.bubble, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      <Dot delay={0} />
      <Dot delay={120} />
      <Dot delay={240} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: "row",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
