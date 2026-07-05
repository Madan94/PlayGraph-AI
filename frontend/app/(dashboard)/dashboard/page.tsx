"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Plus, Upload } from "lucide-react";
import { athletesApi, type Athlete } from "@/lib/api";
import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";

export default function DashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [sport, setSport] = useState("athletics");
  const [position, setPosition] = useState("");
  const [creating, setCreating] = useState(false);

  const loadAthletes = useCallback(() => {
    athletesApi
      .list()
      .then((d) => {
        setAthletes(d.athletes);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load athletes"));
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
      if (position.trim()) metadata.position = position.trim();
      await athletesApi.create({ name: name.trim(), sport: sport.trim() || "athletics", metadata });
      setName("");
      setPosition("");
      setShowForm(false);
      loadAthletes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create athlete");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-foreground/50 mb-8">Memory-first intelligence for elite athlete performance</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-8 h-8 text-purple-light" />
              <div>
                <h2 className="font-semibold">Cognee Brain</h2>
                <p className="text-xs text-foreground/50">Local SDK — data in .cognee_data / .cognee_system</p>
              </div>
            </div>
            <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
              Upload session assets (video, JSON wearables) to populate memory via workers.
              Intelligence flows through remember(), recall(), improve(), and forget().
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple to-cyan text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload Session
            </Link>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Athletes</h3>
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <Plus className="w-3.5 h-3.5" />
                Add athlete
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleCreate} className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    placeholder="Sport"
                    className="bg-white/5 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Position (optional)"
                    className="bg-white/5 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-purple to-cyan text-sm font-medium disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create athlete"}
                </button>
              </form>
            )}

            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
            {athletes.length === 0 && !error ? (
              <p className="text-sm text-foreground/40">No athletes yet — use Add athlete above.</p>
            ) : (
              <div className="space-y-3">
                {athletes.map((a) => (
                  <Link
                    key={a.id}
                    href={`/athletes/${a.id}`}
                    className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center font-bold">
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-foreground/50">
                        {a.sport}
                        {typeof a.metadata?.position === "string" ? ` · ${a.metadata.position}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <LiveMemoryPanel />
      </div>
    </div>
  );
}
