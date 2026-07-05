"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Plus,
  Upload,
  ArrowRight,
  User,
} from "lucide-react";

import { athletesApi, type Athlete } from "@/lib/api";
import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";

export default function DashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [sport, setSport] = useState("Cricket");
  const [position, setPosition] = useState("");

  const loadAthletes = useCallback(() => {
    athletesApi
      .list()
      .then((data) => {
        setAthletes(data.athletes);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load athletes")
      );
  }, []);

  useEffect(() => {
    loadAthletes();
  }, [loadAthletes]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const metadata: Record<string, unknown> = {};

      if (position.trim()) {
        metadata.position = position.trim();
      }

      await athletesApi.create({
        name: name.trim(),
        sport,
        metadata,
      });

      setName("");
      setSport("Cricket");
      setPosition("");
      setShowForm(false);

      loadAthletes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create athlete");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Memory-first intelligence platform for athlete development,
          coaching, and long-term performance analysis.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left */}
        <div className="space-y-6">
          {/* Cognee */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEFC]">
                <Brain className="h-6 w-6 text-[#2452B7]" />
              </div>

              <div>
                <h2 className="font-heading text-lg font-semibold text-slate-900">
                  Cognee Brain
                </h2>

                <p className="text-sm text-slate-500">
                  Persistent AI memory for every athlete
                </p>
              </div>
            </div>

            <p className="mb-6 leading-7 text-slate-600">
              Upload training sessions, wearable data and match analytics.
              Cognee continuously remembers, recalls and improves every
              athlete's long-term performance journey.
            </p>

            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2452B7] px-5 py-3 font-medium text-white transition hover:bg-[#1D4ED8]"
            >
              <Upload className="h-4 w-4" />
              Upload Session
            </Link>
          </div>

          {/* Athletes */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-semibold text-slate-900">
                  Athletes
                </h2>

                <p className="text-sm text-slate-500">
                  Manage athlete profiles
                </p>
              </div>

              <button
                onClick={() => setShowForm((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Add Athlete
              </button>
            </div>

            {showForm && (
              <form
                onSubmit={handleCreate}
                className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Athlete name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#2452B7]"
                  required
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    placeholder="Sport"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#2452B7]"
                  />

                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Position"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#2452B7]"
                  />
                </div>

                <button
                  disabled={creating}
                  className="w-full rounded-xl bg-[#2452B7] py-3 font-medium text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Athlete"}
                </button>
              </form>
            )}

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {athletes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <User className="mb-3 h-10 w-10 text-slate-300" />

                <p className="font-medium text-slate-500">
                  No athletes found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Create your first athlete to begin.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {athletes.map((athlete) => (
                  <Link
                    key={athlete.id}
                    href={`/athletes/${athlete.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2452B7] font-semibold text-white">
                        {athlete.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>

                      <div>
                        <h3 className="font-medium text-slate-900">
                          {athlete.name}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {athlete.sport}
                          {typeof athlete.metadata?.position === "string"
                            ? ` • ${athlete.metadata.position}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <LiveMemoryPanel />
      </div>
    </div>
  );
}