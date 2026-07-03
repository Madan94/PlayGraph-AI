import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";

export default function WorkflowPage() {
  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Memory-First Pipeline</h1>
        <p className="text-sm text-foreground/50">Interactive Cognee orchestration — drag, zoom, explore</p>
      </div>
      <div className="flex-1 grid lg:grid-cols-[1fr_280px] gap-4 min-h-0">
        <WorkflowCanvas />
        <div className="hidden lg:block h-full min-h-0">
          <LiveMemoryPanel />
        </div>
      </div>
    </div>
  );
}
