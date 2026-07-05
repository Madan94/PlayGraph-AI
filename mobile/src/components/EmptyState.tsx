import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({ icon = "sparkles-outline", title, description }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={32} color={theme.muted} />
      <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: theme.muted }]}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", paddingVertical: 32, gap: 8 },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 13, textAlign: "center", paddingHorizontal: 24 },
});
