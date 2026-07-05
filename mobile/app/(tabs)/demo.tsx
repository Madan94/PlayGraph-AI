import React, { useState } from "react";
import { LayoutAnimation, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { chatApi } from "@/api/chat";
import { sessionsApi } from "@/api/sessions";
import { ApiError } from "@/api/client";
import { DEMO_ATHLETE_ID, DEMO_ATHLETE_NAME } from "@/config/env";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/theme/ThemeContext";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { SelectedMedia } from "@/types/media";
import { ChatMessage } from "@/types/chat";
import { ScreenContainer } from "@/components/ScreenContainer";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { ChatBubble } from "@/components/ChatBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { MemoryTimelineList } from "@/components/MemoryTimelineList";
import { TimelineEntry } from "@/api/types";

const DEMO_QUESTION = "How has Rahul improved this month?";

const STEPS = [
  { title: "Signed In", subtitle: "Coach or athlete session active" },
  { title: "Athlete Profile", subtitle: "Open Rahul Sharma's profile" },
  { title: "Ask a Coaching Question", subtitle: "recall() → Qwen LLM" },
  { title: "Record & Upload a Clip", subtitle: "sessions/assets API" },
  { title: "New Memory in Timeline", subtitle: "remember() → recall()" },
];

export default function DemoScreen() {
  const { session } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const { captureFromCamera, pickFromGallery } = useMediaCapture();

  const [step, setStep] = useState(0);
  const [askedMessage, setAskedMessage] = useState<ChatMessage | null>(null);
  const [asking, setAsking] = useState(false);
  const [media, setMedia] = useState<SelectedMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedTopic, setUploadedTopic] = useState<string | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  function goTo(next: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(next);
  }

  async function askCoachingQuestion() {
    setAsking(true);
    try {
      const res = await chatApi.ask(DEMO_ATHLETE_ID, DEMO_QUESTION);
      setAskedMessage({
        id: "demo-answer",
        role: "assistant",
        text: res.answer,
        memoriesUsed: res.recall.memories_used,
        sources: res.recall.sources,
      });
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Could not reach Coach AI", "error");
    } finally {
      setAsking(false);
    }
  }

  async function captureAndUpload(action: () => Promise<SelectedMedia | null>) {
    const picked = await action();
    if (!picked) return;
    setMedia(picked);
    setUploading(true);
    try {
      const created = await sessionsApi.create(DEMO_ATHLETE_ID, "Demo Training Clip");
      const asset = await sessionsApi.uploadAsset(created.id, picked.uri, picked.assetType, picked.mimeType);
      setUploadedTopic(asset.topic);
      toast.show("Training clip uploaded", "success");
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function loadTimeline() {
    setLoadingTimeline(true);
    try {
      const data = await chatApi.timeline(DEMO_ATHLETE_ID);
      setTimelineEntries(data.entries);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Could not load timeline", "error");
    } finally {
      setLoadingTimeline(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.foreground }]}>Guided Demo Flow</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Login → Profile → Ask → Record → Timeline
        </Text>

        <View style={{ height: 16 }} />
        <View style={styles.stepsRow}>
          {STEPS.map((s, i) => (
            <View key={s.title} style={styles.stepDotWrap}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: i <= step ? theme.purple : "transparent",
                    borderColor: i <= step ? theme.purple : theme.surfaceBorder,
                  },
                ]}
              >
                {i < step ? (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                ) : (
                  <Text style={{ color: i === step ? "#fff" : theme.muted, fontSize: 11, fontWeight: "700" }}>
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: i < step ? theme.purple : theme.divider }]} />
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />

        <GlassCard>
          <Text style={[styles.stepTitle, { color: theme.foreground }]}>{STEPS[step].title}</Text>
          <Text style={[styles.stepSubtitle, { color: theme.cyan }]}>{STEPS[step].subtitle}</Text>
          <View style={{ height: 16 }} />

          {step === 0 && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.body, { color: theme.foreground }]}>
                Signed in as <Text style={{ fontWeight: "700" }}>{session?.fullName ?? session?.email}</Text> ({session?.role})
              </Text>
              <GradientButton label="Continue" onPress={() => goTo(1)} />
            </View>
          )}

          {step === 1 && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.body, { color: theme.foreground }]}>
                Open {DEMO_ATHLETE_NAME}'s profile to review performance metrics and memory history.
              </Text>
              <GradientButton
                label="Open Rahul's Profile"
                variant="outline"
                onPress={() => router.push("/(tabs)/profile")}
              />
              <GradientButton label="Continue" onPress={() => goTo(2)} />
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.body, { color: theme.foreground }]}>“{DEMO_QUESTION}”</Text>
              {!askedMessage && !asking && <GradientButton label="Ask Coach AI" onPress={askCoachingQuestion} />}
              {asking && <TypingIndicator />}
              {askedMessage && <ChatBubble message={askedMessage} />}
              {askedMessage && <GradientButton label="Continue" onPress={() => goTo(3)} />}
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.body, { color: theme.foreground }]}>
                Capture a short training clip — it's queued straight to the ingestion pipeline.
              </Text>
              <GradientButton
                label="Record Training Clip"
                loading={uploading}
                onPress={() => captureAndUpload(() => captureFromCamera("video"))}
              />
              <GradientButton
                label="Choose from Gallery Instead"
                variant="outline"
                disabled={uploading}
                onPress={() => captureAndUpload(pickFromGallery)}
              />
              {media && uploadedTopic && (
                <Text style={[styles.hint, { color: theme.emeraldLight }]}>
                  Uploaded → Kafka topic {uploadedTopic}
                </Text>
              )}
              {uploadedTopic && (
                <GradientButton
                  label="Continue"
                  onPress={() => {
                    goTo(4);
                    loadTimeline();
                  }}
                />
              )}
            </View>
          )}

          {step === 4 && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.body, { color: theme.foreground }]}>
                The new clip flows through the workers into memory. Pull down to re-check as it lands.
              </Text>
              <MemoryTimelineList
                entries={timelineEntries}
                loading={loadingTimeline}
                emptyHint="Processing can take a few seconds — refresh below."
              />
              <GradientButton label="Refresh Timeline" variant="outline" onPress={loadTimeline} loading={loadingTimeline} />
              <GradientButton
                label="Restart Demo"
                onPress={() => {
                  setAskedMessage(null);
                  setMedia(null);
                  setUploadedTopic(null);
                  setTimelineEntries([]);
                  goTo(0);
                }}
              />
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  stepsRow: { flexDirection: "row", alignItems: "center" },
  stepDotWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: { flex: 1, height: 2, marginHorizontal: 2 },
  stepTitle: { fontSize: 17, fontWeight: "800" },
  stepSubtitle: { fontSize: 11, fontFamily: "monospace", marginTop: 2 },
  body: { fontSize: 14, lineHeight: 20 },
  hint: { fontSize: 12, fontWeight: "600" },
});
