import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { palette } from "@/theme/colors";

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: "solid" | "outline";
}

export function GradientButton({
  label,
  onPress,
  loading,
  disabled,
  style,
  variant = "solid",
}: GradientButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  if (variant === "outline") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={[styles.outline, { opacity: isDisabled ? 0.5 : 1 }, style]}
      >
        {loading ? (
          <ActivityIndicator color={palette.purpleLight} />
        ) : (
          <Text style={[styles.label, { color: palette.purpleLight }]}>{label}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} disabled={isDisabled} style={style}>
      <LinearGradient
        colors={[palette.purple, palette.cyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.solid, { opacity: isDisabled ? 0.6 : 1 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.label, { color: "#fff" }]}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  solid: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  outline: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: palette.purple,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
