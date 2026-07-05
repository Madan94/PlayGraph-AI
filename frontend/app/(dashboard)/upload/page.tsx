"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  FileVideo,
  FileJson,
  CheckCircle,
} from "lucide-react";

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
    athletesApi.list().then((data) => {
      setAthletes(data.athletes);

      if (data.athletes.length) {
        setAthleteId(data.athletes[0].id);
      }
    });
  }, []);

  async function handleUpload() {
    if (!file || !athleteId || !selectedAthlete) return;

    setLoading(true);
    setStatus(null);

    try {
      const sessionRes = await fetch(`${API_URL}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          athlete_id: athleteId,
          title: `Session — ${new Date().toLocaleDateString()}`,
          type: "training",
          sport: selectedAthlete.sport,
          description: description.trim() || null,
        }),
      });

      if (!sessionRes.ok) {
        throw new Error(await sessionRes.text());
      }

      const session = await sessionRes.json();

      const form = new FormData();

      form.append("file", file);
      form.append(
        "asset_type",
        file.type.startsWith("video") ? "video" : "json"
      );

      const assetRes = await fetch(
        `${API_URL}/api/v1/sessions/${session.id}/assets`,
        {
          method: "POST",
          body: form,
        }
      );

      if (!assetRes.ok) {
        throw new Error(await assetRes.text());
      }

      const asset = await assetRes.json();

      setStatus(
        `Upload successful. Session ${session.id.slice(
          0,
          8
        )} → ${asset.topic}`
      );
    } catch (err) {
      setStatus(
        `Error: ${err instanceof Error ? err.message : "Upload failed"}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEFC]">
          <Upload className="h-6 w-6 text-[#2452B7]" />
        </div>

        <h1 className="font-heading text-4xl font-semibold tracking-tight text-slate-900">
          Upload Session
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Upload training videos or wearable JSON files. The data flows through
          MinIO, Kafka, processing workers, and finally into Cognee memory.
        </p>
      </div>

      {/* Upload Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-6">
          {/* Athlete */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Athlete
            </label>

            <select
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#2452B7] focus:ring-2 focus:ring-[#2452B7]/10"
            >
              <option value="">Select an athlete...</option>

              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name} • {athlete.sport}
                </option>
              ))}
            </select>

            {athletes.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">
                Create an athlete from the dashboard before uploading sessions.
              </p>
            )}
          </div>

          {/* Sport */}
          {selectedAthlete && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                <strong>Sport:</strong> {selectedAthlete.sport}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Session Notes
            </label>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Training focus, match context, injury observations, coach notes..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#2452B7] focus:ring-2 focus:ring-[#2452B7]/10"
            />
          </div>

          {/* File Upload */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="mb-4 flex justify-center">
              {file ? (
                file.type.startsWith("video") ? (
                  <FileVideo className="h-12 w-12 text-[#2452B7]" />
                ) : (
                  <FileJson className="h-12 w-12 text-[#2452B7]" />
                )
              ) : (
                <Upload className="h-12 w-12 text-slate-400" />
              )}
            </div>

            <input
              type="file"
              accept="video/*,application/json,.json"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mx-auto block text-sm"
            />

            <p className="mt-3 text-sm text-slate-500">
              Supported formats: MP4, MOV, AVI, JSON
            </p>

            {file && (
              <p className="mt-3 font-medium text-slate-700">
                {file.name}
              </p>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || !athleteId || loading}
            className="w-full rounded-xl bg-[#2452B7] py-3 font-medium text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Uploading & Processing..." : "Upload Session"}
          </button>

          {/* Status */}
          {status && (
            <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />

              <p className="text-sm text-green-700">
                {status}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}