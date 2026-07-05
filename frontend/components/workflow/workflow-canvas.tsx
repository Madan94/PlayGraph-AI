"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes, initialNodes, initialEdges } from "./pipeline-canvas";

export function WorkflowCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[calc(100vh-8rem)] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="bg-white"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(15,23,42,0.08)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => (n.type === "cognee" ? "#7C3AED" : "#CBD5E1")}
          maskColor="rgba(255,255,255,0.85)"
          className="!rounded-xl !border !border-slate-200 !bg-white"
        />
      </ReactFlow>
    </div>
  );
}
