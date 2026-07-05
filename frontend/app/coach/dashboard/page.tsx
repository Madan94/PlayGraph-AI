"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Brain, Plus, Upload, ArrowRight, User, LayoutDashboard } from "lucide-react";

import { athletesApi, type Athlete } from "@/lib/api";
import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";
import { PageHeader } from "@/components/ui/page-header";

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
      if (position.trim()) metadata.position = position.trim();

      await athletesApi.create({ name: name.trim(), sport, metadata });
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
    <div className="mx-auto max-w-7xl p-8 lg:p-10">
      <PageHeader
        icon={LayoutDashboard}
        badge="Memory-first"
        title="Dashboard"
        description="Memory-first intelligence platform for athlete development, coaching, and long-term performance analysis."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card-padded">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h2 className="section-title text-lg">Cognee Brain</h2>
                <p className="section-subtitle">Persistent AI memory for every athlete</p>
              </div>
            </div>

            <p className="mb-6 leading-7 text-muted">
              Upload training sessions, wearable data and match analytics. Cognee
              continuously remembers, recalls and improves every athlete&apos;s
              long-term performance journey.
            </p>

            <Link href="/coach/upload" className="btn-primary">
              <Upload className="h-4 w-4" />
              Upload Session
            </Link>
          </div>

          <div className="card-padded">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="section-title text-lg">Athletes</h2>
                <p className="section-subtitle">Manage athlete profiles</p>
              </div>
              <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-secondary">
                <Plus className="h-4 w-4" />
                Add Athlete
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleCreate} className="surface-muted mb-6 space-y-4 p-5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Athlete name"
                  className="input-field"
                  required
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    placeholder="Sport"
                    className="input-field"
                  />
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Position"
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={creating} className="btn-primary w-full">
                  {creating ? "Creating..." : "Create Athlete"}
                </button>
              </form>
            )}

            {error && <div className="alert-error mb-4">{error}</div>}

            {athletes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <User className="mb-3 h-10 w-10 text-gray-300" />
                <p className="font-medium text-muted">No athletes found</p>
                <p className="mt-1 text-sm text-gray-400">Create your first athlete to begin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {athletes.map((athlete) => (
                  <Link
                    key={athlete.id}
                    href={`/coach/athletes/${athlete.id}`}
                    className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-gray-200 hover:bg-white hover:shadow-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                        {athlete.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-medium text-black">{athlete.name}</h3>
                        <p className="text-sm text-muted">
                          {athlete.sport}
                          {typeof athlete.metadata?.position === "string"
                            ? ` • ${athlete.metadata.position}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-brand" />
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
