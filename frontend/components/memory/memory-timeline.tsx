"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { memoryApi } from "@/lib/api";

const OP_LABELS: Record<string, string> = {
  remember: "remember()",
  recall: "recall()",
  improve: "improve()",
  forget: "forget()",
};

export function MemoryTimeline() {
  const [ops, setOps] = useState<Record<string, number>>({});
  const [dataset, setDataset] = useState("");

  useEffect(() => {
    memoryApi.stats().then((s) => {
      setOps(s.operations);
      setDataset(s.cognee_dataset);
    }).catch(() => {});
  }, []);

  const steps = Object.entries(ops).filter(([, count]) => count > 0);

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-semibold mb-2">Memory Lifecycle</h2>
      {dataset && <p className="text-[10px] text-foreground/40 mb-6 font-mono">dataset: {dataset}</p>}
      {steps.length === 0 ? (
        <p className="text-sm text-foreground/40">No Cognee operations logged yet — upload session data to begin.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {steps.map(([op, count], i) => (
            <motion.div
              key={op}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 min-w-[120px] text-center"
            >
              <code className="text-xs font-mono font-bold block mb-1">{OP_LABELS[op] ?? op}</code>
              <p className="text-lg font-mono text-cyan">{count}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
