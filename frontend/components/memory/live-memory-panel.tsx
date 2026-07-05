"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Brain, Radio } from "lucide-react";
import { cn, API_URL } from "@/lib/utils";

export interface LifecycleEvent {
  op: "remember" | "recall" | "improve" | "forget" | "graph_updated" | "heartbeat";
  message?: string;
  delta?: number;
  count?: number;
  nodes?: number;
  edges?: number;
  at?: string;
}

const OP_STYLES: Record<string, string> = {
  remember: "text-emerald border-emerald/30 bg-emerald/10",
  recall: "text-cyan border-cyan/30 bg-cyan/10",
  improve: "text-purple-light border-purple/30 bg-purple/10",
  forget: "text-foreground/50 border-white/10 bg-white/5",
  graph_updated: "text-cyan border-cyan/20 bg-cyan/5",
};

const OP_LABELS: Record<string, string> = {
  remember: "remember()",
  recall: "recall()",
  improve: "improve()",
  forget: "forget()",
  graph_updated: "Knowledge Graph",
};

export function LiveMemoryPanel() {
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({ remember: 0, recall: 0, improve: 0, forget: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`${API_URL}/api/v1/memory/stream`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const data: LifecycleEvent = JSON.parse(e.data);
        if (data.op === "heartbeat") return;
        setEvents((prev) => [data, ...prev].slice(0, 50));
        setStats((s) => {
          const next = { ...s };
          if (data.op === "remember") next.remember += data.delta ?? 1;
          if (data.op === "recall") next.recall += 1;
          if (data.op === "improve") next.improve += 1;
          if (data.op === "forget") next.forget += 1;
          return next;
        });
      } catch {
        /* ignore parse errors */
      }
    };
    return () => es.close();
  }, []);

  return (
    <div className="glass rounded-2xl flex flex-col h-full min-h-[500px]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-light" />
        <div>
          <h2 className="font-semibold text-sm">Live Memory Stream</h2>
          <p className="text-[10px] text-foreground/40">Cognee lifecycle — real-time</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Radio className={cn("w-3 h-3", connected ? "text-emerald animate-pulse" : "text-foreground/30")} />
          <span className="text-[10px] text-foreground/50">{connected ? "LIVE" : "OFFLINE"}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 p-3 border-b border-white/5">
        {[
          { label: "remember()", value: stats.remember, color: "text-emerald" },
          { label: "recall()", value: stats.recall, color: "text-cyan" },
          { label: "improve()", value: stats.improve, color: "text-purple-light" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-white/[0.03] p-2 text-center">
            <p className={cn("text-lg font-bold font-mono", s.color)}>{s.value}</p>
            <p className="text-[9px] text-foreground/40 font-mono">{s.label}</p>
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <p className="text-xs text-foreground/30 text-center py-12">
              Waiting for Cognee memory events…
              <br />
              <span className="text-[10px]">Upload a session to begin</span>
            </p>
          ) : (
            events.map((event, i) => (
              <motion.div
                key={`${event.at}-${i}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3 h-3 text-foreground/30" />
                  <code className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", OP_STYLES[event.op] ?? OP_STYLES.remember)}>
                    {OP_LABELS[event.op] ?? event.op}
                  </code>
                  {event.delta && <span className="text-[9px] text-emerald">+{event.delta}</span>}
                  {event.count && <span className="text-[9px] text-cyan">{event.count} sessions</span>}
                </div>
                {event.message && (
                  <p className="text-[10px] text-foreground/60 leading-relaxed">{event.message}</p>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
