"use client";

import { motion } from "framer-motion";
import { Zap, Database, GitBranch, Lock, Puzzle } from "lucide-react";

const REASONS = [
  {
    icon: Database,
    title: "Persistent per-entity memory",
    desc: "Cognee organizes memories into per-athlete datasets — not one giant context window. Each athlete has their own knowledge graph that grows over time.",
  },
  {
    icon: GitBranch,
    title: "remember() / recall() / improve()",
    desc: "A clean API for the full memory lifecycle. Store sessions with remember(), query with recall(), and let Cognee refine connections with improve().",
  },
  {
    icon: Zap,
    title: "Automatic knowledge graph extraction",
    desc: "Cognee extracts entities, relationships, and summaries from unstructured data — video transcripts, JSON metrics, coach notes — without custom NLP pipelines.",
  },
  {
    icon: Lock,
    title: "Multi-tenant by design",
    desc: "Dataset isolation, access control, and user scoping are built into Cognee's architecture — critical for platforms serving multiple coaches and athletes.",
  },
  {
    icon: Puzzle,
    title: "LLM and embedding agnostic",
    desc: "Swap between OpenRouter, OpenAI, Ollama, or any LiteLLM-compatible provider. Cognee handles the memory layer regardless of which model powers extraction.",
  },
];

export function LandingWhyCognee() {
  return (
    <section id="cognee" className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge-new mb-4 inline-flex">Why Cognee</span>
          <h2 className="page-title mb-4">
            The intelligence layer is Cognee
          </h2>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            We chose Cognee as the foundation because athlete intelligence
            demands persistent, structured, per-entity memory — not just embeddings in a vector store.
          </p>
        </motion.div>

        <div className="space-y-4">
          {REASONS.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-shadow hover:shadow-soft"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <r.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-black">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
