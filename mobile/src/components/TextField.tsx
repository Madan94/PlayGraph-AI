import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={theme.mutedFaint}
        style={[
          styles.input,
          {
            color: theme.foreground,
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.surfaceBorder,
          },
          style,
        ]}
        {...props}
      />
      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 12, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: { fontSize: 12 },
});
