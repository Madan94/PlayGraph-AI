"use client";

import { useState } from "react";
import { API_URL } from "@/lib/utils";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const sessionRes = await fetch(`${API_URL}/api/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Cricket Session — ${new Date().toLocaleDateString()}`,
          type: "training",
          sport: "cricket",
        }),
      });
      const session = await sessionRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("asset_type", file.type.startsWith("video") ? "video" : "json");

      const assetRes = await fetch(`${API_URL}/api/v1/sessions/${session.id}/assets`, {
        method: "POST",
        body: form,
      });
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
      <p className="text-foreground/50 mb-8">Triggers ingestion → workers → remember()</p>

      <div className="glass rounded-2xl p-8 border-2 border-dashed border-white/10 text-center">
        <input
          type="file"
          accept="video/*,application/json,.json"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mb-4 text-sm"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple to-cyan text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload & Process"}
        </button>
        {status && <p className="mt-4 text-xs text-foreground/60">{status}</p>}
      </div>
    </div>
  );
}
