"use client";

import { motion } from "framer-motion";
import { ArrowRight, Upload, Cpu, Database, Brain, BarChart3, MessageSquare } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "1. Upload",
    desc: "Coach or athlete uploads training video, wearable JSON, or session notes.",
  },
  {
    icon: Cpu,
    title: "2. Process",
    desc: "Kafka routes to specialized workers — vision models analyze video, parsers extract metrics.",
  },
  {
    icon: Database,
    title: "3. Remember",
    desc: "Cognee stores structured memories in per-athlete datasets with automatic graph extraction.",
  },
  {
    icon: Brain,
    title: "4. Recall",
    desc: "On any query, Cognee retrieves relevant memories from the athlete's knowledge graph.",
  },
  {
    icon: MessageSquare,
    title: "5. Insight",
    desc: "Coach chat generates grounded answers with cited evidence. Reports are built from recalled data.",
  },
  {
    icon: BarChart3,
    title: "6. Improve",
    desc: "Cognee continuously refines the knowledge graph — connections strengthen over time.",
  },
];

export function LandingWorkflow() {
  return (
    <section id="workflow" className="py-24 border-y border-gray-100 bg-gray-50/50">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge-new mb-4 inline-flex">How it works</span>
          <h2 className="page-title mb-4">
            From raw session data to coach-ready intelligence
          </h2>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            A fully orchestrated pipeline that turns every upload into persistent,
            queryable athlete memory.
          </p>
        </motion.div>

        <div className="grid gap-px md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="relative bg-white rounded-2xl border border-gray-100 p-6 shadow-card"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold text-black">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{step.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute right-4 top-6 hidden h-4 w-4 text-gray-300 lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
