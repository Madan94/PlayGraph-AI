import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { OfflineBanner } from "./OfflineBanner";

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ("top" | "bottom" | "left" | "right")[];
}

export function ScreenContainer({ children, style, edges = ["top", "bottom"] }: ScreenContainerProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: theme.background }, style]}
    >
      <OfflineBanner />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
