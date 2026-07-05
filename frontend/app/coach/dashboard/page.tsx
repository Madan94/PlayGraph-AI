"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, Plus, Upload, ArrowRight, User, LayoutDashboard, Loader2 } from "lucide-react";

import { athletesApi } from "@/lib/api";
import { useAthletes } from "@/lib/hooks/use-athletes";
import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";
import { TrainingTimeline } from "@/components/athletes/training-timeline";
import { PageHeader } from "@/components/ui/page-header";

export default function CoachDashboardPage() {
  const { athletes, loading: athletesLoading, error: athletesError, reload } = useAthletes();
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [sport, setSport] = useState("Cricket");
  const [position, setPosition] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState("");

  useEffect(() => {
    if (!athletes.length) {
      setSelectedAthleteId("");
      return;
    }
    if (!selectedAthleteId || !athletes.some((a) => a.id === selectedAthleteId)) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athletes, selectedAthleteId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setFormError(null);

    try {
      const metadata: Record<string, unknown> = {};
      if (position.trim()) metadata.position = position.trim();

      const created = await athletesApi.create({ name: name.trim(), sport, metadata });
      setName("");
      setSport("Cricket");
      setPosition("");
      setShowForm(false);
      setSelectedAthleteId(created.id);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create athlete");
    } finally {
      setCreating(false);
    }
  }

  const displayError = formError ?? athletesError;

  return (
    <div className="app-page-xl">
      <PageHeader
        icon={LayoutDashboard}
        badge="Memory-first"
        title="Dashboard"
        description="Manage athletes, upload sessions, and monitor Cognee memory in real time."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-padded">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h2 className="section-title text-lg">Quick Actions</h2>
                <p className="section-subtitle">Upload data or invite athletes</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/coach/upload" className="btn-primary">
                <Upload className="h-4 w-4" />
                Upload
              </Link>
              <Link href="/coach/invites" className="btn-secondary">
                Invite Athlete
              </Link>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted">
            Sessions flow through Kafka workers into Cognee Cloud. Use chat and timeline to recall
            what was ingested.
          </p>
        </div>

        <div className="card-padded">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="section-title text-lg">Athletes</h2>
                <p className="section-subtitle">
                  {athletesLoading
                    ? "Loading roster…"
                    : `${athletes.length} athlete${athletes.length === 1 ? "" : "s"} on your roster`}
                </p>
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    placeholder="Sport"
                    className="input-field"
                  />
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Position (optional)"
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={creating} className="btn-primary w-full">
                  {creating ? "Creating…" : "Create Athlete"}
                </button>
              </form>
            )}

            {displayError && <div className="alert-error mb-4">{displayError}</div>}

            {athletesLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading athletes…</span>
              </div>
            ) : athletes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <User className="mb-3 h-10 w-10 text-gray-300" />
                <p className="font-medium text-muted">No athletes yet</p>
                <p className="mt-1 max-w-sm text-sm text-gray-400">
                  Create a roster athlete, upload a session, then share an invite code so they can
                  link their account.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="btn-primary mt-4"
                >
                  <Plus className="h-4 w-4" />
                  Add First Athlete
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {athletes.map((athlete) => (
                  <Link
                    key={athlete.id}
                    href={`/coach/athletes/${athlete.id}`}
                    className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-gray-200 hover:bg-white hover:shadow-card"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                        {athlete.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-black">{athlete.name}</h3>
                        <p className="truncate text-sm text-muted">
                          {athlete.sport}
                          {typeof athlete.metadata?.position === "string"
                            ? ` • ${athlete.metadata.position}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-brand" />
                  </Link>
                ))}
              </div>
            )}
        </div>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="section-title text-lg">Training Timeline</h2>
            <p className="section-subtitle">Recalled memories for a selected athlete</p>
          </div>
          {athletes.length > 0 && (
            <select
              value={selectedAthleteId}
              onChange={(e) => setSelectedAthleteId(e.target.value)}
              className="input-field w-full max-w-xs"
            >
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name} — {athlete.sport}
                </option>
              ))}
            </select>
          )}
        </div>
        <TrainingTimeline
          athleteId={selectedAthleteId || null}
          noAthleteMessage="Create or select an athlete above to view their training timeline."
          emptyMessage="No memories yet — upload a session for this athlete to populate Cognee."
        />
      </section>

      <section className="card min-h-[480px] overflow-hidden">
        <LiveMemoryPanel embedded />
      </section>
    </div>
  );
}
