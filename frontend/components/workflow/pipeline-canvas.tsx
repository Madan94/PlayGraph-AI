"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

function NodeBox({
  title,
  subtitle,
  children,
  active,
  highlight,
  className,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  active?: boolean;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white min-w-[140px] shadow-sm transition-all",
        active && "border-cyan/50 shadow-cyan/20 shadow-md",
        highlight && "border-purple/60 shadow-purple/30 shadow-md scale-105",
        !active && !highlight && "border-slate-200",
        className
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-purple !border-none" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-cyan !border-none" />
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-900">{title}</p>
        {subtitle && <p className="text-[9px] text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="p-2">{children}</div>}
    </div>
  );
}

export const InputNode = memo(function InputNode({ data }: NodeProps) {
  return (
    <NodeBox title="Input Sources" subtitle="Multi-modal">
      <div className="space-y-1 text-[8px] text-slate-500">
        {["Video", "Audio", "Wearables", "JSON", "Notes"].map((l) => (
          <div key={l} className="px-1.5 py-0.5 rounded bg-slate-100">{l}</div>
        ))}
      </div>
    </NodeBox>
  );
});

export const StreamingNode = memo(function StreamingNode({ data }: NodeProps) {
  return (
    <NodeBox title="Streaming" subtitle="Chunk · RTMP" active={data?.active as boolean}>
      <div className="grid grid-cols-2 gap-1 text-[8px]">
        {["Chunking", "WebRTC", "Buffer", "Monitor"].map((l) => (
          <span key={l} className="px-1 py-0.5 rounded bg-cyan/10 text-cyan">{l}</span>
        ))}
      </div>
    </NodeBox>
  );
});

export const GatewayNode = memo(function GatewayNode({ data }: NodeProps) {
  return (
    <NodeBox title="API Gateway" subtitle="JWT · RBAC">
      <div className="text-[8px] text-slate-500 space-y-0.5">
        <div>Auth · Rate Limit · SSL</div>
      </div>
    </NodeBox>
  );
});

export const IngestionNode = memo(function IngestionNode({ data }: NodeProps) {
  return (
    <NodeBox title="Ingestion" subtitle="Validate → Publish">
      <div className="text-[8px] text-slate-500">Detect type · Metadata · Kafka</div>
    </NodeBox>
  );
});

export const KafkaNode = memo(function KafkaNode({ data }: NodeProps) {
  return (
    <NodeBox title="Apache Kafka" subtitle="Event Bus" active={data?.active as boolean}>
      <div className="flex gap-1 overflow-hidden">
        {["video.chunk", "memory.updated"].map((e) => (
          <span key={e} className="text-[7px] px-1 py-0.5 rounded bg-cyan/10 text-cyan whitespace-nowrap font-mono">{e}</span>
        ))}
      </div>
    </NodeBox>
  );
});

export const WorkersNode = memo(function WorkersNode({ data }: NodeProps) {
  return (
    <NodeBox title="Workers" subtitle="Memory Producers">
      <div className="grid grid-cols-2 gap-1 text-[8px]">
        {["Video", "Audio", "JSON", "Image"].map((w) => (
          <span key={w} className="px-1 py-0.5 rounded bg-purple/10 text-purple-light">{w}</span>
        ))}
      </div>
    </NodeBox>
  );
});

export const CogneeNode = memo(function CogneeNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-purple !border-2 !border-purple-light" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-cyan !border-2 !border-cyan-light" />
      <Handle type="source" position={Position.Bottom} id="b" className="!w-2 !h-2 !bg-emerald" />
      <div className="rounded-2xl border-2 border-brand/30 bg-brand-light p-4 min-w-[200px]">
        <p className="mb-2 text-sm font-bold text-brand">Cognee Brain</p>
        <div className="grid grid-cols-2 gap-1.5">
          {["remember()", "recall()", "improve()", "forget()"].map((fn) => (
            <code key={fn} className="text-[8px] font-mono px-1.5 py-1 rounded bg-slate-100 text-center">{fn}</code>
          ))}
        </div>
      </div>
    </div>
  );
});

export const ConsumersNode = memo(function ConsumersNode({ data }: NodeProps) {
  return (
    <NodeBox title="Consumers" subtitle="recall() callers">
      <div className="text-[8px] text-slate-500 space-y-0.5">
        {["Analytics", "LLM Chat", "Reports"].map((c) => (
          <div key={c}>{c}</div>
        ))}
      </div>
    </NodeBox>
  );
});

export const OutputsNode = memo(function OutputsNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-cyan" />
      <NodeBox title="Outputs" subtitle="Dashboard · Reports">
        <div className="flex gap-1 text-[8px]">
          {["Timeline", "Charts", "PDF"].map((o) => (
            <span key={o} className="px-1.5 py-0.5 rounded bg-slate-100">{o}</span>
          ))}
        </div>
      </NodeBox>
    </div>
  );
});

export const nodeTypes = {
  input: InputNode,
  streaming: StreamingNode,
  gateway: GatewayNode,
  ingestion: IngestionNode,
  kafka: KafkaNode,
  workers: WorkersNode,
  cognee: CogneeNode,
  consumers: ConsumersNode,
  outputs: OutputsNode,
};

export const initialNodes = [
  { id: "input", type: "input", position: { x: 0, y: 120 }, data: {} },
  { id: "streaming", type: "streaming", position: { x: 220, y: 100 }, data: { active: true } },
  { id: "gateway", type: "gateway", position: { x: 420, y: 110 }, data: {} },
  { id: "ingestion", type: "ingestion", position: { x: 620, y: 100 }, data: {} },
  { id: "kafka", type: "kafka", position: { x: 820, y: 90 }, data: { active: true } },
  { id: "workers", type: "workers", position: { x: 820, y: 280 }, data: {} },
  { id: "cognee", type: "cognee", position: { x: 1080, y: 160 }, data: {} },
  { id: "consumers", type: "consumers", position: { x: 1360, y: 80 }, data: {} },
  { id: "outputs", type: "outputs", position: { x: 1080, y: 380 }, data: {} },
];

export const initialEdges = [
  { id: "e1", source: "input", target: "streaming", animated: true, style: { stroke: "#0066FF" } },
  { id: "e2", source: "streaming", target: "gateway", animated: true, style: { stroke: "#0066FF" } },
  { id: "e3", source: "gateway", target: "ingestion", animated: true, style: { stroke: "#94A3B8" } },
  { id: "e4", source: "ingestion", target: "kafka", animated: true, style: { stroke: "#0066FF" } },
  { id: "e5", source: "kafka", target: "workers", animated: true, style: { stroke: "#94A3B8" } },
  { id: "e6", source: "workers", target: "cognee", animated: true, style: { stroke: "#0066FF" } },
  { id: "e7", source: "cognee", target: "consumers", animated: true, style: { stroke: "#10B981" } },
  { id: "e8", source: "cognee", target: "outputs", sourceHandle: "b", animated: true },
  { id: "e9", source: "consumers", target: "outputs", animated: true },
];
