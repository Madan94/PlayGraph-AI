import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";
import { GitBranch } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function WorkflowPage() {
  return (
    <div className="app-page-xl flex min-h-0 flex-1 flex-col gap-6">
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
          <div className="h-[min(560px,70vh)] min-h-[400px]">
            <WorkflowCanvas />
          </div>
        </section>

        <section className="card min-h-[480px] overflow-hidden lg:min-h-0">
          <LiveMemoryPanel embedded />
        </section>
      </div>
    </div>
  );
}
