"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Layers, Clock, ShieldOff } from "lucide-react";

const PROBLEMS = [
  {
    icon: Layers,
    title: "Fragmented athlete data",
    desc: "Video files, wearable CSVs, session notes — scattered across drives and spreadsheets with no unified view.",
  },
  {
    icon: Clock,
    title: "No long-term memory",
    desc: "Coaches lose context between sessions. Month-over-month progress, recurring injury patterns, and subtle trends vanish.",
  },
  {
    icon: AlertTriangle,
    title: "Manual analysis bottleneck",
    desc: "Reviewing footage, writing reports, and correlating data takes hours per session. It doesn't scale.",
  },
  {
    icon: ShieldOff,
    title: "Generic AI tools miss context",
    desc: "ChatGPT can't recall last week's session. Every conversation starts from zero without persistent athlete memory.",
  },
];

export function LandingProblem() {
  return (
    <section id="problem" className="py-24 border-b border-gray-100">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge-new mb-4 inline-flex">The problem</span>
          <h2 className="page-title mb-4">
            Athlete data is everywhere. Insights are nowhere.
          </h2>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            Coaches juggle video, wearables, and session notes across disconnected tools.
            Long-term patterns are invisible, and every analysis session starts from scratch.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-card"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <p.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-black">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
