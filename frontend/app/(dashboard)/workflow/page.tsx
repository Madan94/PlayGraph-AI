import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";
import { GitBranch } from "lucide-react";

export default function WorkflowPage() {
  return (
    <div className="mx-auto flex h-screen max-w-7xl flex-col p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEFC]">
          <GitBranch className="h-6 w-6 text-[#2452B7]" />
        </div>

        <h1 className="font-heading text-4xl font-semibold tracking-tight text-slate-900">
          Memory Pipeline
        </h1>

        <p className="mt-2 max-w-3xl text-slate-500">
          Explore the complete Cognee memory orchestration pipeline. Follow how
          athlete sessions move through ingestion, processing, memory creation,
          knowledge graph construction, and AI-powered retrieval.
        </p>
      </div>

      {/* Workflow */}
      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-heading text-xl font-semibold text-slate-900">
              Workflow Canvas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Interactive visualization of the end-to-end memory pipeline.
            </p>
          </div>

          <div className="h-[calc(100%-88px)]">
            <WorkflowCanvas />
          </div>
        </section>

        <section className="hidden min-h-0 lg:block">
          <LiveMemoryPanel />
        </section>
      </div>
    </div>
  );
}