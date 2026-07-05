import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { sessionsApi } from "@/api/sessions";
import { ApiError } from "@/api/client";
import { AssetType, SessionDetail } from "@/api/types";
import { DEMO_ATHLETE_ID } from "@/config/env";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { SelectedMedia } from "@/types/media";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/theme/ThemeContext";
import { ScreenContainer } from "@/components/ScreenContainer";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { TextField } from "@/components/TextField";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function UploadScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { pickFromGallery, captureFromCamera } = useMediaCapture();

  const [media, setMedia] = useState<SelectedMedia | null>(null);
  const [title, setTitle] = useState(`Cricket Session — ${new Date().toLocaleDateString()}`);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [resultTopic, setResultTopic] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionDetail | null>(null);
  const [uploadedSessionId, setUploadedSessionId] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

  async function toggleRecording() {
    if (recorderState.isRecording) {
      await recorder.stop();
      if (recorder.uri) {
        setMedia({
          uri: recorder.uri,
          assetType: "audio",
          mimeType: "audio/m4a",
          label: `Voice note (${Math.round((recorderState.durationMillis ?? 0) / 1000)}s)`,
        });
      }
      return;
    }
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      toast.show("Microphone permission is required", "error");
      return;
    }
    setState("idle");
    setResultTopic(null);
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function handlePick(action: () => Promise<SelectedMedia | null>) {
    const picked = await action();
    if (picked) {
      setMedia(picked);
      setState("idle");
      setResultTopic(null);
    }
  }

  async function handleUpload() {
    if (!media) return;
    setState("uploading");
    setProgress(0);
    setSessionStatus(null);
    setUploadedSessionId(null);
    try {
      const session = await sessionsApi.create(DEMO_ATHLETE_ID, title);
      const asset = await sessionsApi.uploadAsset(session.id, media.uri, media.assetType, media.mimeType, setProgress);
      setResultTopic(asset.topic);
      setUploadedSessionId(session.id);
      setState("success");
      toast.show("Upload complete — ingestion started", "success");
      // Poll session status once after a short delay
      setTimeout(async () => {
        try {
          const detail = await sessionsApi.get(session.id);
          setSessionStatus(detail);
        } catch {
          // silently ignore status poll failure
        }
      }, 3000);
    } catch (e) {
      setState("error");
      toast.show(e instanceof ApiError ? e.message : "Upload failed", "error");
    }
  }

  const iconFor = (assetType: AssetType) =>
    assetType === "video" ? "videocam" : assetType === "audio" ? "mic" : "image";

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.foreground }]}>Capture & Upload</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Triggers ingestion → workers → remember()</Text>

        <View style={{ height: 20 }} />

        <View style={styles.grid}>
          <ActionCard icon="videocam-outline" label="Record Video" onPress={() => handlePick(() => captureFromCamera("video"))} />
          <ActionCard icon="camera-outline" label="Take Photo" onPress={() => handlePick(() => captureFromCamera("photo"))} />
          <ActionCard icon="images-outline" label="Gallery" onPress={() => handlePick(pickFromGallery)} />
          <ActionCard
            icon={recorderState.isRecording ? "stop-circle" : "mic-outline"}
            label={recorderState.isRecording ? `Recording ${Math.round((recorderState.durationMillis ?? 0) / 1000)}s` : "Record Audio"}
            onPress={toggleRecording}
            active={recorderState.isRecording}
          />
        </View>

        <View style={{ height: 20 }} />

        {media && (
          <GlassCard>
            <View style={styles.mediaRow}>
              <View style={[styles.mediaIcon, { backgroundColor: theme.purple + "22" }]}>
                <Ionicons name={iconFor(media.assetType)} size={20} color={theme.purpleLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mediaLabel, { color: theme.foreground }]}>{media.label}</Text>
                <Text style={[styles.mediaType, { color: theme.muted }]}>{media.assetType.toUpperCase()}</Text>
              </View>
              <Ionicons name="close-circle" size={20} color={theme.mutedFaint} onPress={() => setMedia(null)} suppressHighlighting />
            </View>

            <View style={{ height: 16 }} />
            <TextField label="Session Title" value={title} onChangeText={setTitle} />
            <View style={{ height: 16 }} />

            {state === "uploading" && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.cyan }]} />
              </View>
            )}

            <View style={{ height: 12 }} />
            <GradientButton
              label={state === "uploading" ? `Uploading ${Math.round(progress * 100)}%` : "Upload & Process"}
              onPress={handleUpload}
              loading={state === "uploading"}
              disabled={state === "uploading"}
            />
          </GlassCard>
        )}

        {state === "success" && (
          <GlassCard style={{ marginTop: 16 }}>
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={22} color={theme.emerald} />
              <Text style={[styles.successText, { color: theme.foreground }]}>
                Uploaded! Queued on Kafka topic {"\n"}
                <Text style={{ fontFamily: "monospace", color: theme.emeraldLight }}>{resultTopic}</Text>
              </Text>
            </View>
            {sessionStatus && (
              <>
                <View style={{ height: 12 }} />
                <View style={[styles.statusRow, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.statusLabel, { color: theme.muted }]}>Session status</Text>
                  <Text style={[styles.statusValue, { color: theme.cyan }]}>{sessionStatus.status}</Text>
                </View>
              </>
            )}
            <View style={{ height: 12 }} />
            <GradientButton
              label="View in Timeline"
              variant="outline"
              onPress={() => router.push("/(tabs)/profile")}
            />
          </GlassCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function ActionCard({
  icon,
  label,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable style={styles.actionCardWrap} onPress={onPress}>
      <GlassCard style={styles.actionCard}>
        <Ionicons name={icon} size={26} color={active ? theme.danger : theme.purpleLight} />
        <Text style={[styles.actionLabel, { color: theme.foreground }]}>{label}</Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2, fontFamily: "monospace" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCardWrap: { width: "47%" },
  actionCard: { alignItems: "center", gap: 8, paddingVertical: 22 },
  actionLabel: { fontSize: 12.5, fontWeight: "600", textAlign: "center" },
  mediaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  mediaIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mediaLabel: { fontSize: 14, fontWeight: "600" },
  mediaType: { fontSize: 11, marginTop: 1 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  successRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  successText: { fontSize: 13, flex: 1, lineHeight: 19 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", borderRadius: 8, padding: 10 },
  statusLabel: { fontSize: 12 },
  statusValue: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
});
