import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";
import { GitBranch } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function WorkflowPage() {
  return (
    <div className="mx-auto flex h-screen max-w-7xl flex-col p-8 lg:p-10">
      <PageHeader
        icon={GitBranch}
        title="Memory Pipeline"
        description="Explore the complete Cognee memory orchestration pipeline. Follow how athlete sessions move through ingestion, processing, memory creation, knowledge graph construction, and AI-powered retrieval."
      />

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="section-title">Workflow Canvas</h2>
            <p className="section-subtitle">
              Interactive visualization of the end-to-end memory pipeline.
            </p>
          </div>
          <div className="h-[calc(100%-88px)]">
            <WorkflowCanvas />
          </div>
        </section>

        <section className="hidden min-h-0 lg:block">
          <LiveMemoryPanel embedded />
        </section>
      </div>
    </div>
  );
}
