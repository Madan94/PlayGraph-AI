import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatApi } from "@/api/chat";
import { ApiError } from "@/api/client";
import { DEMO_ATHLETE_ID } from "@/config/env";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/theme/ThemeContext";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ChatBubble } from "@/components/ChatBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/types/chat";

const HISTORY_KEY = `nextplayai.chat.${DEMO_ATHLETE_ID}`;

const SUGGESTIONS = [
  "How has Rahul improved?",
  "What injuries affected performance?",
  "Compare last five matches.",
  "What drills should Rahul practice?",
];

export default function ChatScreen() {
  const theme = useTheme();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) setMessages(JSON.parse(raw));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(messages)).catch(() => {});
  }, [messages]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || sending) return;

    const userMsg: ChatMessage = { id: `${Date.now()}-u`, role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));

    try {
      const res = await chatApi.ask(DEMO_ATHLETE_ID, question);
      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-a`,
        role: "assistant",
        text: res.answer,
        memoriesUsed: res.recall.memories_used,
        sources: res.recall.sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Something went wrong";
      toast.show(message, "error");
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-a`, role: "assistant", text: `⚠️ ${message}`, failed: true },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <ScreenContainer edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.foreground }]}>Coach AI Chat</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>recall() → Qwen LLM → grounded answer</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ChatBubble message={item} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={sending ? <TypingIndicator /> : null}
          ListEmptyComponent={
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={[styles.suggestionChip, { borderColor: theme.surfaceBorder, backgroundColor: theme.surface }]}
                >
                  <Text style={[styles.suggestionText, { color: theme.foreground }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          }
        />

        <View style={[styles.inputRow, { borderTopColor: theme.divider }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about athlete performance…"
            placeholderTextColor={theme.mutedFaint}
            style={[styles.input, { color: theme.foreground, backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            multiline
            onSubmitEditing={() => send(input)}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={sending || !input.trim()}
            style={[styles.sendButton, { backgroundColor: theme.purple, opacity: sending || !input.trim() ? 0.5 : 1 }]}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 11.5, marginTop: 2, fontFamily: "monospace" },
  listContent: { padding: 16, flexGrow: 1, justifyContent: "flex-end" },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: "auto", marginBottom: 8 },
  suggestionChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  suggestionText: { fontSize: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14.5,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
