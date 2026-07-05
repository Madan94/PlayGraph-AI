"use client";

import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";
import { MemoryTimeline } from "@/components/memory/memory-timeline";

export default function MemoryPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Memory</h1>
        <p className="text-foreground/50">Cognee lifecycle — upload sessions to see live events</p>
      </div>
      <MemoryTimeline />
      <div className="h-[600px]">
        <LiveMemoryPanel />
      </div>
    </div>
  );
}
