"use client";

import { Brain } from "lucide-react";

import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";
import { MemoryTimeline } from "@/components/memory/memory-timeline";

export default function MemoryPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEFC]">
          <Brain className="h-6 w-6 text-[#2452B7]" />
        </div>

        <h1 className="font-heading text-4xl font-semibold tracking-tight text-slate-900">
          Memory
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Monitor Cognee's memory lifecycle in real time. Upload athlete
          sessions to watch memories being remembered, recalled, improved,
          and organized into the knowledge graph.
        </p>
      </div>

      {/* Memory Timeline */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            Memory Timeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Chronological view of stored athlete memories
          </p>
        </div>

        <MemoryTimeline />
      </section>

      {/* Live Stream */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            Live Memory Stream
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Real-time Cognee lifecycle events and knowledge graph updates
          </p>
        </div>

        <div className="h-[620px]">
          <LiveMemoryPanel />
        </div>
      </section>
    </div>
  );
}