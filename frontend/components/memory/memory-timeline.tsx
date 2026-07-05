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
  improve: "text-[#2452B7]",
  forget: "text-slate-600",
};

export function MemoryTimeline() {
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

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEFC]">
          <Brain className="h-6 w-6 text-[#2452B7]" />
        </div>

        <div>
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            Memory Lifecycle
          </h2>

          <p className="text-sm text-slate-500">
            Cognee operation statistics
          </p>

          {dataset && (
            <p className="mt-1 font-mono text-xs text-slate-400">
              Dataset: {dataset}
            </p>
          )}
        </div>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <p className="font-medium text-slate-500">
            No memory operations recorded
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Upload athlete sessions to begin tracking Cognee's lifecycle.
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
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="font-mono text-sm text-slate-500">
                {OP_LABELS[op] ?? op}
              </p>

              <p
                className={`mt-3 text-3xl font-bold ${
                  OP_COLORS[op] ?? "text-slate-700"
                }`}
              >
                {count}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}