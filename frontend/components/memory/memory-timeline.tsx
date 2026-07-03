"use client";

import { motion } from "framer-motion";

const STEPS = [
  { op: "remember()", desc: "Store new athlete memories", color: "from-emerald/20 to-emerald/5 border-emerald/30" },
  { op: "Graph Updated", desc: "Knowledge graph nodes connected", color: "from-cyan/20 to-cyan/5 border-cyan/30" },
  { op: "recall()", desc: "Retrieve relevant context", color: "from-cyan/20 to-purple/10 border-cyan/30" },
  { op: "improve()", desc: "Merge & enrich memories", color: "from-purple/20 to-purple/5 border-purple/30" },
  { op: "forget()", desc: "Archive obsolete data", color: "from-white/10 to-white/5 border-white/10" },
  { op: "Graph Updated", desc: "Evolved knowledge graph", color: "from-emerald/20 to-cyan/10 border-emerald/30" },
];

export function MemoryTimeline() {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-semibold mb-6">Memory Lifecycle</h2>
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`rounded-xl border bg-gradient-to-br p-3 min-w-[120px] text-center ${step.color}`}
            >
              <code className="text-xs font-mono font-bold block mb-1">{step.op}</code>
              <p className="text-[10px] text-foreground/50">{step.desc}</p>
            </motion.div>
            {i < STEPS.length - 1 && (
              <motion.span
                className="text-purple-light mx-1 hidden md:inline"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                →
              </motion.span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
