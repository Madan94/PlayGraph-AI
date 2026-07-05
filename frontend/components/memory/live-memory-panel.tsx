"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Brain, Radio, Network } from "lucide-react";

import { cn } from "@/lib/utils";

export interface LifecycleEvent {
  op:
    | "remember"
    | "recall"
    | "improve"
    | "forget"
    | "graph_updated"
    | "heartbeat";
  message?: string;
  delta?: number;
  count?: number;
  nodes?: number;
  edges?: number;
  at?: string;
}

const OP_STYLES: Record<string, string> = {
  remember: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  recall: "bg-sky-50 text-sky-700 border border-sky-200",
  improve: "bg-brand-light text-brand border border-brand-muted",
  forget: "bg-gray-100 text-muted border border-gray-200",
  graph_updated: "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

const OP_LABELS: Record<string, string> = {
  remember: "remember()",
  recall: "recall()",
  improve: "improve()",
  forget: "forget()",
  graph_updated: "Knowledge Graph",
};

export function LiveMemoryPanel({ embedded = false }: { embedded?: boolean }) {
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({
    remember: 0,
    recall: 0,
    improve: 0,
    forget: 0,
    nodes: 0,
    edges: 0,
  });

  useEffect(() => {
    const es = new EventSource("/api/v1/memory/stream");

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const data: LifecycleEvent = JSON.parse(e.data);
        if (data.op === "heartbeat") return;

        setEvents((prev) => [data, ...prev].slice(0, 50));
        setStats((prev) => {
          const next = { ...prev };
          switch (data.op) {
            case "remember":
              next.remember += data.delta ?? 1;
              break;
            case "recall":
              next.recall++;
              break;
            case "improve":
              next.improve++;
              break;
            case "forget":
              next.forget++;
              break;
            case "graph_updated":
              next.nodes = data.nodes ?? next.nodes;
              next.edges = data.edges ?? next.edges;
              break;
          }
          return next;
        });
      } catch {
        // Ignore malformed events
      }
    };

    return () => es.close();
  }, []);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-white",
        embedded ? "min-h-0" : "card min-h-[620px]"
      )}
    >
      <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h2 className="section-title">Live Memory Stream</h2>
          <p className="section-subtitle">Real-time Cognee lifecycle events</p>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5">
          <Radio
            className={cn(
              "h-3.5 w-3.5",
              connected ? "animate-pulse text-emerald-500" : "text-gray-400"
            )}
          />
          <span className="text-xs font-medium text-muted">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-b border-gray-100 p-4">
        {[
          { label: "remember()", value: stats.remember, color: "text-emerald-600" },
          { label: "recall()", value: stats.recall, color: "text-sky-600" },
          { label: "improve()", value: stats.improve, color: "text-brand" },
        ].map((item) => (
          <div key={item.label} className="surface-muted p-4 text-center">
            <p className={cn("text-2xl font-bold", item.color)}>{item.value}</p>
            <p className="mt-1 text-xs text-muted">{item.label}</p>
          </div>
        ))}
      </div>

      {(stats.nodes > 0 || stats.edges > 0) && (
        <div className="flex items-center gap-6 border-b border-gray-100 bg-gray-50 px-5 py-3 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-brand" />
            <span>
              <strong className="text-black">{stats.nodes}</strong> Nodes
            </span>
          </div>
          <span>
            <strong className="text-black">{stats.edges}</strong> Edges
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Brain className="mb-4 h-10 w-10 text-gray-300" />
              <p className="font-medium text-muted">Waiting for memory events...</p>
              <p className="mt-2 text-sm text-gray-400">
                Upload an athlete session to begin streaming Cognee events.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, index) => (
                <motion.div
                  key={`${event.at}-${index}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="surface-muted p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <span
                      className={cn(
                        "rounded-lg px-2 py-1 text-xs font-semibold",
                        OP_STYLES[event.op] ?? OP_STYLES.remember
                      )}
                    >
                      {OP_LABELS[event.op] ?? event.op}
                    </span>
                    {event.delta && (
                      <span className="text-xs font-medium text-emerald-600">+{event.delta}</span>
                    )}
                    {event.count && (
                      <span className="text-xs text-sky-600">{event.count} sessions</span>
                    )}
                  </div>
                  {event.message && (
                    <p className="text-sm leading-6 text-muted">{event.message}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
