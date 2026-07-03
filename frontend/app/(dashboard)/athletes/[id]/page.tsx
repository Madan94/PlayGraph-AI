"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { chatApi, DEMO_ATHLETE_ID, downloadReport } from "@/lib/api";
import { PerformanceCharts } from "@/components/athletes/performance-charts";

export default function AthletePage() {
  const [timeline, setTimeline] = useState<{ summary: string }[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    chatApi.timeline(DEMO_ATHLETE_ID).then((d) => setTimeline(d.entries)).catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard" className="text-xs text-foreground/40 hover:text-foreground mb-2 inline-block">← Dashboard</Link>
          <h1 className="text-3xl font-bold">Rahul Sharma</h1>
          <p className="text-foreground/50">Cricket · Batsman · Apex United</p>
        </div>
        <button
          onClick={async () => {
            setReportLoading(true);
            try { await downloadReport(DEMO_ATHLETE_ID); } finally { setReportLoading(false); }
          }}
          disabled={reportLoading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple to-cyan text-sm font-medium disabled:opacity-50"
        >
          {reportLoading ? "Generating…" : "Download Report (recall → PDF)"}
        </button>
      </div>

      <PerformanceCharts />

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Training Timeline <span className="text-xs text-cyan font-mono">recall()</span></h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-foreground/40">Seed demo memories to populate timeline.</p>
        ) : (
          <div className="space-y-3">
            {timeline.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 items-start"
              >
                <div className="w-2 h-2 rounded-full bg-emerald mt-2 shrink-0" />
                <p className="text-sm text-foreground/70">{entry.summary.slice(0, 200)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
