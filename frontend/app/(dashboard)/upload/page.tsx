"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/utils";
import { athletesApi, type Athlete } from "@/lib/api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteId, setAthleteId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedAthlete = athletes.find((a) => a.id === athleteId);

  useEffect(() => {
    athletesApi.list().then((d) => {
      setAthletes(d.athletes);
      if (d.athletes[0]) setAthleteId(d.athletes[0].id);
    });
  }, []);

  async function handleUpload() {
    if (!file || !athleteId || !selectedAthlete) return;
    setLoading(true);
    setStatus(null);
    try {
      const sessionRes = await fetch(`${API_URL}/api/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athlete_id: athleteId,
          title: `Session — ${new Date().toLocaleDateString()}`,
          type: "training",
          sport: selectedAthlete.sport,
          description: description.trim() || null,
        }),
      });
      if (!sessionRes.ok) throw new Error(await sessionRes.text());
      const session = await sessionRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("asset_type", file.type.startsWith("video") ? "video" : "json");

      const assetRes = await fetch(`${API_URL}/api/v1/sessions/${session.id}/assets`, {
        method: "POST",
        body: form,
      });
      if (!assetRes.ok) throw new Error(await assetRes.text());
      const asset = await assetRes.json();
      setStatus(`Uploaded! Session ${session.id.slice(0, 8)}… → Kafka topic ${asset.topic}`);
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : "Upload failed"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Upload Session</h1>
      <p className="text-foreground/50 mb-8">MinIO → Kafka → workers → remember()</p>

      <div className="glass rounded-2xl p-8 border-2 border-dashed border-white/10">
        <label className="text-xs text-foreground/50 block mb-2">Athlete</label>
        <select
          value={athleteId}
          onChange={(e) => setAthleteId(e.target.value)}
          className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm mb-4 outline-none"
        >
          <option value="">Select athlete…</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.sport})
            </option>
          ))}
        </select>
        {athletes.length === 0 && (
          <p className="text-xs text-foreground/40 mb-4">
            No athletes in Postgres — create one on the dashboard first.
          </p>
        )}

        {selectedAthlete && (
          <p className="text-xs text-foreground/40 mb-4">
            Sport for this session: <strong>{selectedAthlete.sport}</strong>
          </p>
        )}

        <label className="text-xs text-foreground/50 block mb-2">Session notes (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Drill focus, match context, injury notes…"
          className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm mb-4 outline-none min-h-[72px] resize-y"
        />

        <input
          type="file"
          accept="video/*,application/json,.json"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mb-4 text-sm w-full"
        />
        <button
          onClick={handleUpload}
          disabled={!file || !athleteId || loading}
          className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple to-cyan text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload & Process"}
        </button>
        {status && <p className="mt-4 text-xs text-foreground/60">{status}</p>}
      </div>
    </div>
  );
}
