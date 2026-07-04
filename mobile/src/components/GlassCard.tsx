import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/theme/ThemeContext";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({ children, style }: GlassCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.wrapper, { borderColor: theme.surfaceBorder }]}>
      <BlurView
        intensity={theme.mode === "dark" ? 40 : 60}
        tint={theme.mode}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.overlay, { backgroundColor: theme.surface }]} />
      <View style={[styles.content, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: 20,
  },
});
