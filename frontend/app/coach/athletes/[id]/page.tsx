"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { athletesApi, chatApi, downloadReport } from "@/lib/api";
import { PerformanceCharts } from "@/components/athletes/performance-charts";

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
    athletesApi.get(athleteId).then((a) => {
      setName(a.name);
      setSport(a.sport);
    }).catch(() => setError("Athlete not found"));
    chatApi.timeline(athleteId).then((d) => setTimeline(d.entries)).catch(() => {});
  }, [athleteId]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8 lg:p-10">
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
        <h2 className="section-title mb-4">
          Training Timeline <span className="font-mono text-xs font-normal text-brand">recall()</span>
        </h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted">No memories yet — upload a session to populate Cognee.</p>
        ) : (
          <div className="space-y-3">
            {timeline.map((entry, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <p className="text-sm leading-6 text-muted">{entry.summary.slice(0, 500)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
