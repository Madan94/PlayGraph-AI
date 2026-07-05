"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, CheckCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { athletesApi, createSessionAndUpload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function CoachUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [athleteId, setAthleteId] = useState("");
  const [athletes, setAthletes] = useState<{ id: string; name: string; sport: string }[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(true);
  const [athletesError, setAthletesError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateAthlete, setShowCreateAthlete] = useState(false);
  const [creatingAthlete, setCreatingAthlete] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState("");
  const [newAthleteSport, setNewAthleteSport] = useState("Cricket");

  const selectedAthlete = athletes.find((a) => a.id === athleteId);
  const canUpload = Boolean(file && athleteId && !loading);

  const loadAthletes = useCallback(() => {
    setAthletesLoading(true);
    setAthletesError(null);
    athletesApi
      .list()
      .then((data) => {
        setAthletes(data.athletes);
        if (data.athletes.length) {
          setAthleteId((current) => current || data.athletes[0].id);
        } else {
          setAthleteId("");
          setShowCreateAthlete(true);
        }
      })
      .catch((err) => {
        setAthletesError(err instanceof Error ? err.message : "Failed to load athletes");
        setAthletes([]);
        setAthleteId("");
      })
      .finally(() => setAthletesLoading(false));
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadAthletes();
    }
  }, [authLoading, user, loadAthletes]);

  async function handleCreateAthlete(e: React.FormEvent) {
    e.preventDefault();
    if (!newAthleteName.trim()) return;
    setCreatingAthlete(true);
    setAthletesError(null);
    try {
      const created = await athletesApi.create({
        name: newAthleteName.trim(),
        sport: newAthleteSport.trim() || "athletics",
      });
      setNewAthleteName("");
      setNewAthleteSport("Cricket");
      setShowCreateAthlete(false);
      await loadAthletes();
      setAthleteId(created.id);
    } catch (err) {
      setAthletesError(err instanceof Error ? err.message : "Failed to create athlete");
    } finally {
      setCreatingAthlete(false);
    }
  }

  async function handleUpload() {
    if (!file || !athleteId || !selectedAthlete) return;
    setLoading(true);
    setStatus(null);
    try {
      const asset = await createSessionAndUpload(
        athleteId,
        selectedAthlete.sport,
        description,
        file
      );
      setStatus(`Upload successful → ${asset.topic ?? "queued"}`);
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

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8 lg:p-10">
      <PageHeader
        icon={Upload}
        title="Upload Session"
        description="Upload training videos or wearable JSON for a linked athlete."
      />

      <section className="card p-8">
        <div className="space-y-6">
          <div>
            <label className="field-label">Athlete</label>
            {athletesLoading ? (
              <p className="text-sm text-muted">Loading athletes...</p>
            ) : athletes.length === 0 ? (
              <p className="mb-3 text-sm text-muted">
                Create an athlete profile first — uploads are stored per athlete in Cognee.
              </p>
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
                  <button
                    type="button"
                    onClick={() => setShowCreateAthlete(true)}
                    className="btn-secondary text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Athlete
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
                    <div className="flex gap-2">
                      <button type="submit" disabled={creatingAthlete} className="btn-primary flex-1">
                        {creatingAthlete ? "Creating..." : "Create Athlete"}
                      </button>
                      {athletes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowCreateAthlete(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {athletesError && <div className="alert-error">{athletesError}</div>}

          <div>
            <label className="field-label">Session Notes</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              placeholder="Training focus, match context..."
            />
          </div>

          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
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
            className="btn-primary w-full py-3 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading..." : "Upload Session"}
          </button>

          {!canUpload && !loading && (
            <p className="text-center text-sm text-muted">
              {!athleteId
                ? "Create or select an athlete to enable upload."
                : !file
                  ? "Choose a video or JSON file to enable upload."
                  : null}
            </p>
          )}

          {status && (
            <div className={`flex gap-3 ${status.startsWith("Error") ? "alert-error" : "alert-success"}`}>
              {status.startsWith("Error") ? null : <CheckCircle className="h-5 w-5 shrink-0" />}
              <p>{status}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
