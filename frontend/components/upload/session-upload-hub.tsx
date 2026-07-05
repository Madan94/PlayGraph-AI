"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  CheckCircle,
  Plus,
  Video,
  Image as ImageIcon,
  Mic,
  FileJson,
  StickyNote,
  Radio,
  Activity,
  Square,
  Circle,
} from "lucide-react";
import {
  athletesApi,
  createSessionAndSubmitNote,
  createSessionAndUpload,
  createSessionAndUploadMany,
  type UploadTab,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const TABS: { id: UploadTab; label: string; icon: typeof Video }[] = [
  { id: "video", label: "Video", icon: Video },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "audio", label: "Audio", icon: Mic },
  { id: "json", label: "JSON", icon: FileJson },
  { id: "notes", label: "Notes", icon: StickyNote },
];

type Props = {
  role: "coach" | "athlete";
};

export function SessionUploadHub({ role }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<UploadTab>("video");
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [athleteId, setAthleteId] = useState("");
  const [athletes, setAthletes] = useState<{ id: string; name: string; sport: string }[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(role === "coach");
  const [athletesError, setAthletesError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateAthlete, setShowCreateAthlete] = useState(false);
  const [creatingAthlete, setCreatingAthlete] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState("");
  const [newAthleteSport, setNewAthleteSport] = useState("Cricket");

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedAthlete = athletes.find((a) => a.id === athleteId);
  const sport = selectedAthlete?.sport ?? (user?.role === "athlete" ? "athletics" : "Cricket");
  const resolvedAthleteId = role === "coach" ? athleteId : user?.athlete_id ?? "";

  const canSubmit =
    !loading &&
    !!resolvedAthleteId &&
    (tab === "notes"
      ? noteText.trim().length > 0
      : tab === "images"
        ? files.length > 0
        : tab === "audio"
          ? !!file || !!recordedBlob
          : !!file);

  const loadAthletes = useCallback(() => {
    if (role !== "coach") return;
    setAthletesLoading(true);
    athletesApi
      .list()
      .then((data) => {
        setAthletes(data.athletes);
        if (data.athletes.length) {
          setAthleteId((c) => c || data.athletes[0].id);
        } else {
          setAthleteId("");
          setShowCreateAthlete(true);
        }
      })
      .catch((err) => {
        setAthletesError(err instanceof Error ? err.message : "Failed to load athletes");
      })
      .finally(() => setAthletesLoading(false));
  }, [role]);

  useEffect(() => {
    if (!authLoading && user && role === "coach") loadAthletes();
  }, [authLoading, user, role, loadAthletes]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleCreateAthlete(e: React.FormEvent) {
    e.preventDefault();
    if (!newAthleteName.trim()) return;
    setCreatingAthlete(true);
    try {
      const created = await athletesApi.create({
        name: newAthleteName.trim(),
        sport: newAthleteSport.trim() || "athletics",
      });
      setNewAthleteName("");
      setShowCreateAthlete(false);
      loadAthletes();
      setAthleteId(created.id);
    } catch (err) {
      setAthletesError(err instanceof Error ? err.message : "Failed to create athlete");
    } finally {
      setCreatingAthlete(false);
    }
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      setRecordedBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setRecordSeconds(0);
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function handleSubmit() {
    if (!resolvedAthleteId) return;
    setLoading(true);
    setStatus(null);
    try {
      const athleteSport = role === "coach" ? selectedAthlete?.sport ?? sport : sport;

      if (tab === "notes") {
        const r = await createSessionAndSubmitNote(
          resolvedAthleteId,
          athleteSport,
          description,
          noteText.trim()
        );
        setStatus(r.message ?? "Note saved to athlete memory");
        setNoteText("");
      } else if (tab === "images") {
        const r = await createSessionAndUploadMany(
          resolvedAthleteId,
          athleteSport,
          description,
          files,
          "image"
        );
        setStatus(`Uploaded ${r.count} image(s) — processing started`);
        setFiles([]);
      } else if (tab === "audio") {
        const audioFile =
          file ??
          (recordedBlob
            ? new File([recordedBlob], `recording-${Date.now()}.webm`, { type: "audio/webm" })
            : null);
        if (!audioFile) throw new Error("No audio file");
        const r = await createSessionAndUpload(
          resolvedAthleteId,
          athleteSport,
          description,
          audioFile,
          "audio"
        );
        setStatus(`Upload successful → ${r.topic ?? "audio.process.requested"}`);
        setFile(null);
        setRecordedBlob(null);
      } else if (tab === "json") {
        if (!file) throw new Error("No JSON file");
        const r = await createSessionAndUpload(
          resolvedAthleteId,
          athleteSport,
          description,
          file,
          "json"
        );
        setStatus(`Upload successful → ${r.topic ?? "json.process.requested"}`);
        setFile(null);
      } else {
        if (!file) throw new Error("No video file");
        const r = await createSessionAndUpload(
          resolvedAthleteId,
          athleteSport,
          description,
          file,
          "video"
        );
        setStatus(`Upload successful → ${r.topic ?? "video.process.requested"}`);
        setFile(null);
      }
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Upload failed"}`);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <p className="text-muted p-8">Loading...</p>;
  }

  if (!user) {
    return <p className="text-muted p-8">Please sign in to upload sessions.</p>;
  }

  if (role === "athlete" && !user.athlete_id) {
    return (
      <p className="text-muted p-8">
        Complete your athlete profile in Settings before uploading.
      </p>
    );
  }

  const submitLabel =
    tab === "notes"
      ? loading
        ? "Saving..."
        : "Save Note"
      : tab === "images"
        ? loading
          ? "Uploading..."
          : `Upload ${files.length || ""} Image${files.length === 1 ? "" : "s"}`.trim()
        : loading
          ? "Uploading..."
          : "Upload Session";

  return (
    <section className="card p-8">
      <div className="space-y-6">
        {role === "coach" && (
          <div>
            <label className="field-label">Athlete</label>
            {athletesLoading ? (
              <p className="text-sm text-muted">Loading athletes...</p>
            ) : athletes.length === 0 ? (
              <p className="mb-3 text-sm text-muted">Create an athlete to upload session data.</p>
            ) : (
              <select
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                className="input-field"
              >
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} • {a.sport}
                  </option>
                ))}
              </select>
            )}
            {!athletesLoading && (
              <div className="mt-3">
                {!showCreateAthlete ? (
                  <button type="button" onClick={() => setShowCreateAthlete(true)} className="btn-secondary text-sm">
                    <Plus className="h-4 w-4" /> Add Athlete
                  </button>
                ) : (
                  <form onSubmit={handleCreateAthlete} className="surface-muted space-y-3 p-4">
                    <input
                      value={newAthleteName}
                      onChange={(e) => setNewAthleteName(e.target.value)}
                      placeholder="Athlete name"
                      className="input-field"
                      required
                    />
                    <input
                      value={newAthleteSport}
                      onChange={(e) => setNewAthleteSport(e.target.value)}
                      placeholder="Sport"
                      className="input-field"
                    />
                    <button type="submit" disabled={creatingAthlete} className="btn-primary w-full">
                      {creatingAthlete ? "Creating..." : "Create Athlete"}
                    </button>
                  </form>
                )}
              </div>
            )}
            {athletesError && <div className="alert-error mt-3">{athletesError}</div>}
          </div>
        )}

        <div>
          <label className="field-label">Session context (optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field resize-none"
            placeholder="Training focus, match context, drills..."
          />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setStatus(null);
              }}
              className={
                tab === t.id
                  ? "inline-flex items-center gap-2 rounded-lg bg-brand-light px-4 py-2 text-sm font-medium text-brand"
                  : "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-muted hover:bg-gray-50"
              }
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "video" && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mx-auto block text-sm"
            />
            {file && <p className="mt-3 font-medium">{file.name}</p>}
          </div>
        )}

        {tab === "images" && (
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block text-sm"
            />
            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {files.map((f) => (
                  <div key={f.name + f.size} className="rounded-lg border border-gray-100 p-2 text-xs truncate">
                    {f.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "audio" && (
          <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-6">
            <div>
              <p className="mb-2 text-sm font-medium">Upload audio file</p>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setRecordedBlob(null);
                }}
                className="block text-sm"
              />
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="mb-2 text-sm font-medium">Or record in browser</p>
              <div className="flex flex-wrap items-center gap-3">
                {!recording ? (
                  <button type="button" onClick={startRecording} className="btn-secondary">
                    <Circle className="h-4 w-4 fill-red-500 text-red-500" />
                    Record
                  </button>
                ) : (
                  <button type="button" onClick={stopRecording} className="btn-secondary">
                    <Square className="h-4 w-4" />
                    Stop ({recordSeconds}s)
                  </button>
                )}
                {recordedBlob && !file && (
                  <span className="text-sm text-muted">Recording ready ({recordSeconds}s)</span>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "json" && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mx-auto block text-sm"
            />
            {file && <p className="mt-3 font-medium">{file.name}</p>}
          </div>
        )}

        {tab === "notes" && (
          <textarea
            rows={6}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="input-field resize-none"
            placeholder="Coach observations, session summary, injury notes..."
          />
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary w-full py-3 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4" />
          {submitLabel}
        </button>

        {!canSubmit && !loading && (
          <p className="text-center text-sm text-muted">
            {!resolvedAthleteId
              ? "Select or create an athlete first."
              : tab === "notes"
                ? "Enter note text to save."
                : tab === "images"
                  ? "Select one or more images."
                  : tab === "audio"
                    ? "Upload or record audio."
                    : "Choose a file to upload."}
          </p>
        )}

        {status && (
          <div className={`flex gap-3 ${status.startsWith("Error") ? "alert-error" : "alert-success"}`}>
            {!status.startsWith("Error") && <CheckCircle className="h-5 w-5 shrink-0" />}
            <p>{status}</p>
          </div>
        )}

        <div className="grid gap-3 border-t border-gray-100 pt-6 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 opacity-70">
            <Radio className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-black">Live video streaming</p>
              <p className="text-sm text-muted">Real-time session capture</p>
              <span className="badge-new mt-2 inline-flex">Coming soon</span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 opacity-70">
            <Activity className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-black">Live wearable sensors</p>
              <p className="text-sm text-muted">HR, GPS, and IMU streams</p>
              <span className="badge-new mt-2 inline-flex">Coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
