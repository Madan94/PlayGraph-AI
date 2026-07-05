import React from "react";
import { StyleSheet, Text } from "react-native";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTheme } from "@/theme/ThemeContext";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const theme = useTheme();
  if (isOnline) return null;

  return (
    <Text style={[styles.banner, { backgroundColor: theme.danger, color: "#fff" }]}>
      You&apos;re offline — some data may be out of date
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 6,
  },
});
