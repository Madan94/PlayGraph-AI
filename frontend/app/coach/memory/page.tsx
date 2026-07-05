"use client";

import { Brain } from "lucide-react";

import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";
import { MemoryTimeline } from "@/components/memory/memory-timeline";
import { PageHeader } from "@/components/ui/page-header";

export default function MemoryPage() {
  return (
    <div className="app-page-xl space-y-8">
      <PageHeader
        icon={Brain}
        title="Memory"
        description="Monitor Cognee's memory lifecycle in real time. Upload athlete sessions to watch memories being remembered, recalled, improved, and organized into the knowledge graph."
      />

      <section className="card-padded">
        <div className="mb-6">
          <h2 className="section-title">Memory Operations</h2>
          <p className="section-subtitle">Cognee remember / recall / improve counts for your dataset</p>
        </div>
        <MemoryTimeline embedded />
      </section>

      <section className="card-padded">
        <div className="mb-6">
          <h2 className="section-title">Live Memory Stream</h2>
          <p className="section-subtitle">
            Real-time Cognee lifecycle events and knowledge graph updates
          </p>
        </div>
        <div className="h-[620px]">
          <LiveMemoryPanel embedded />
        </div>
      </section>
    </div>
  );
}
