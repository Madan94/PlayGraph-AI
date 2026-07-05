"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { memoryApi } from "@/lib/api";

const OP_LABELS: Record<string, string> = {
  remember: "remember()",
  recall: "recall()",
  improve: "improve()",
  forget: "forget()",
};

const OP_COLORS: Record<string, string> = {
  remember: "text-emerald-600",
  recall: "text-sky-600",
  improve: "text-brand",
  forget: "text-muted",
};

export function MemoryTimeline({ embedded = false }: { embedded?: boolean }) {
  const [ops, setOps] = useState<Record<string, number>>({});
  const [dataset, setDataset] = useState("");

  useEffect(() => {
    memoryApi
      .stats()
      .then((stats) => {
        setOps(stats.operations);
        setDataset(stats.cognee_dataset);
      })
      .catch(() => {});
  }, []);

  const steps = Object.entries(ops).filter(([, count]) => count > 0);

  const content = (
    <>
      {!embedded && (
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h2 className="section-title">Memory Lifecycle</h2>
            <p className="section-subtitle">Cognee operation statistics</p>
            {dataset && (
              <p className="mt-1 font-mono text-xs text-gray-400">Dataset: {dataset}</p>
            )}
          </div>
        </div>
      )}

      {embedded && dataset && (
        <p className="mb-4 font-mono text-xs text-gray-400">Dataset: {dataset}</p>
      )}

      {steps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <p className="font-medium text-muted">No memory operations recorded</p>
          <p className="mt-2 text-sm text-gray-400">
            Upload athlete sessions to begin tracking Cognee&apos;s lifecycle.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([op, count], index) => (
            <motion.div
              key={op}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="surface-muted p-5"
            >
              <p className="font-mono text-sm text-muted">{OP_LABELS[op] ?? op}</p>
              <p className={`mt-3 text-3xl font-bold ${OP_COLORS[op] ?? "text-black"}`}>
                {count}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return <div>{content}</div>;

  return <div className="card-padded">{content}</div>;
}
