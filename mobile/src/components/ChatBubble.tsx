import React, { useState } from "react";
import { LayoutAnimation, Platform, StyleSheet, Text, UIManager, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { ChatMessage } from "@/types/chat";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === "user";

  return (
    <View style={[styles.row, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.purple, borderTopRightRadius: 4 }
            : {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorder,
                borderWidth: 1,
                borderTopLeftRadius: 4,
              },
        ]}
      >
        {!isUser && (
          <View style={styles.assistantTag}>
            <Ionicons name="sparkles" size={11} color={theme.cyanLight} />
            <Text style={[styles.assistantTagText, { color: theme.cyanLight }]}>Coach AI</Text>
            {typeof message.memoriesUsed === "number" && (
              <Text style={[styles.memCount, { color: theme.mutedFaint }]}>
                · {message.memoriesUsed} memories
              </Text>
            )}
          </View>
        )}
        <Text style={[styles.text, { color: isUser ? "#fff" : theme.foreground }]}>{message.text}</Text>

        {!isUser && message.sources && message.sources.length > 0 && (
          <View>
            <Text
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpanded((v) => !v);
              }}
              style={[styles.toggle, { color: theme.purpleLight }]}
              suppressHighlighting
            >
              {expanded ? "Hide supporting memories ▲" : `Show ${message.sources.length} supporting memories ▼`}
            </Text>
            {expanded && (
              <View style={styles.sourceList}>
                {message.sources.map((s, i) => (
                  <View key={i} style={[styles.sourceItem, { borderLeftColor: theme.emerald }]}>
                    <Text style={[styles.sourceText, { color: theme.muted }]}>{s.summary}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 12 },
  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  assistantTag: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  assistantTagText: { fontSize: 10.5, fontWeight: "700" },
  memCount: { fontSize: 10 },
  text: { fontSize: 14.5, lineHeight: 21 },
  toggle: { fontSize: 11.5, fontWeight: "600", marginTop: 8 },
  sourceList: { marginTop: 8, gap: 6 },
  sourceItem: { borderLeftWidth: 2, paddingLeft: 8 },
  sourceText: { fontSize: 11.5, lineHeight: 16 },
});
