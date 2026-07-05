import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";

type ToastKind = "info" | "success" | "error";

interface ToastState {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, kind: ToastKind = "info") => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      const id = Date.now();
      setToast({ id, message, kind });
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, speed: 16 }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
          setToast((current) => (current?.id === id ? null : current))
        );
      }, 2800);
    },
    [opacity]
  );

  const accent =
    toast?.kind === "error" ? theme.danger : toast?.kind === "success" ? theme.emerald : theme.cyan;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            {
              top: insets.top + 8,
              opacity,
              transform: [
                {
                  translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
                },
              ],
              backgroundColor: theme.mode === "dark" ? "#18181B" : "#FFFFFF",
              borderColor: accent,
            },
          ]}
        >
          <Text style={[styles.text, { color: theme.foreground }]} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    zIndex: 999,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
});
