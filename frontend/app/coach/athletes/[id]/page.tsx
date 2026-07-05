"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { athletesApi, chatApi, downloadReport } from "@/lib/api";
import { PerformanceCharts } from "@/components/athletes/performance-charts";
import { TrainingTimeline } from "@/components/athletes/training-timeline";

export default function CoachAthletePage() {
  const params = useParams();
  const athleteId = params.id as string;
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [timeline, setTimeline] = useState<{ summary: string }[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    athletesApi
      .get(athleteId)
      .then((a) => {
        setName(a.name);
        setSport(a.sport);
      })
      .catch(() => setError("Athlete not found"));
    chatApi
      .timeline(athleteId)
      .then((d) => setTimeline(d.entries))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load timeline")
      );
  }, [athleteId]);

  return (
    <div className="app-page-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/coach/dashboard" className="mb-2 inline-block text-xs text-muted hover:text-black">
            ← Dashboard
          </Link>
          <h1 className="page-title text-3xl">{name || "Athlete"}</h1>
          <p className="mt-1 text-muted">{sport || "—"}</p>
          {error && <p className="alert-error mt-2 inline-block">{error}</p>}
        </div>
        <button
          type="button"
          onClick={async () => {
            setReportLoading(true);
            try {
              await downloadReport(athleteId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Report failed");
            } finally {
              setReportLoading(false);
            }
          }}
          disabled={reportLoading || !athleteId}
          className="btn-primary shrink-0"
        >
          {reportLoading ? "Generating…" : "Download Report"}
        </button>
      </div>
      <PerformanceCharts entries={timeline} />
      <div className="glass p-6">
        <TrainingTimeline athleteId={athleteId} embedded />
      </div>
    </div>
  );
}
