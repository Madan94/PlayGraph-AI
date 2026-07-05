"use client";

import { useState } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { authApi, createSessionAndUpload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AthleteUploadPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [sport, setSport] = useState("Cricket");
  const [onboarding, setOnboarding] = useState(false);

  const athleteId = user?.athlete_id;
  const canUpload = Boolean(file && athleteId && !loading);

  async function handleOnboarding(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setOnboarding(true);
    setStatus(null);
    try {
      await authApi.completeOnboarding({
        full_name: fullName.trim(),
        sport: sport.trim() || "athletics",
      });
      await refresh();
      setStatus("Profile created. You can now upload sessions.");
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Failed to create profile"}`);
    } finally {
      setOnboarding(false);
    }
  }

  async function handleUpload() {
    if (!file || !athleteId) return;
    setLoading(true);
    setStatus(null);
    try {
      await createSessionAndUpload(athleteId, sport || "athletics", description, file);
      setStatus("Upload successful — processing started.");
      setFile(null);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Upload failed"}`);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl p-8 lg:p-10">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl p-8 lg:p-10">
        <p className="text-muted">Please sign in to upload sessions.</p>
      </div>
    );
  }

  if (!athleteId) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 p-8 lg:p-10">
        <PageHeader
          icon={Upload}
          title="Complete Your Profile"
          description="Finish setup before uploading your first session."
        />
        <section className="card p-8 space-y-4">
          <form onSubmit={handleOnboarding} className="space-y-4">
            <div>
              <label className="field-label">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="field-label">Sport</label>
              <input
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" disabled={onboarding || !fullName.trim()} className="btn-primary w-full">
              {onboarding ? "Saving..." : "Complete Profile"}
            </button>
          </form>
          {status && <p className="text-sm text-muted">{status}</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8 lg:p-10">
      <PageHeader icon={Upload} title="Upload Session" description="Upload your training video or performance data." />
      <section className="card p-8 space-y-6">
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field resize-none"
          placeholder="Session notes..."
        />
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
          <input
            type="file"
            accept="video/*,application/json,.json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mx-auto block text-sm"
          />
          {file && <p className="mt-3 font-medium">{file.name}</p>}
        </div>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!canUpload}
          className="btn-primary w-full disabled:cursor-not-allowed"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
        {!canUpload && !loading && !file && (
          <p className="text-center text-sm text-muted">Choose a video or JSON file to enable upload.</p>
        )}
        {status && (
          <div className={`flex gap-3 ${status.startsWith("Error") ? "alert-error" : "alert-success"}`}>
            {status.startsWith("Error") ? null : <CheckCircle className="h-5 w-5" />}
            {status}
          </div>
        )}
      </section>
    </div>
  );
}
