"use client";

import { motion } from "framer-motion";
import { Brain, Video, MessageSquare, Network } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Memory-first architecture",
    desc: "Every session is stored in Cognee with per-athlete datasets. Memory persists across months — nothing is forgotten.",
  },
  {
    icon: Video,
    title: "Automated video intelligence",
    desc: "Upload training footage. Vision models extract metrics, narratives, and tactical observations without manual tagging.",
  },
  {
    icon: MessageSquare,
    title: "Coach chat with evidence",
    desc: "Ask natural questions about any athlete. Responses are grounded in recalled memories with cited sources.",
  },
  {
    icon: Network,
    title: "Living knowledge graph",
    desc: "Cognee automatically extracts entities and relationships, building a growing performance graph per athlete.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge-new mb-4 inline-flex">Features</span>
          <h2 className="page-title mb-4">
            Built for coaches who think long-term
          </h2>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            Enterprise-grade memory infrastructure with a production SaaS experience.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-padded group transition-shadow hover:shadow-soft"
            >
              <div className="icon-badge !mb-3 !h-10 !w-10 transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-black">{f.title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
