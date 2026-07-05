"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What is PlayGraphAI?",
    a: "PlayGraphAI is a memory-first athlete intelligence platform. It ingests training video, wearable data, and session notes into Cognee — then lets coaches query long-term performance history through natural language chat, timelines, and auto-generated reports.",
  },
  {
    q: "How does the memory system work?",
    a: "Every upload goes through a processing pipeline: Kafka routes data to workers, vision models analyze video, and Cognee stores structured memories in per-athlete datasets with automatic knowledge graph extraction. When a coach asks a question, Cognee retrieves relevant memories using recall() and grounds the AI response in actual data.",
  },
  {
    q: "What is Cognee and why do you use it?",
    a: "Cognee is an open-source AI memory framework with a clean remember/recall/improve API. We use it because athlete development requires persistent, structured, per-entity memory — not just embeddings. Cognee automatically builds a knowledge graph from unstructured data and supports multi-tenant dataset isolation.",
  },
  {
    q: "What data formats do you support?",
    a: "Training videos (MP4, MOV, AVI), wearable data exports (JSON), and text session notes. Vision models extract metrics and narratives from video. The system is sport-agnostic — cricket, football, athletics, or any discipline.",
  },
  {
    q: "How are coach and athlete accounts different?",
    a: "Coaches get the full platform: upload sessions, manage athlete rosters via invite codes, use coach chat, view memory timelines, and generate reports. Athletes get a personal portal to upload their own sessions, view their timeline, and link to coaches via invite codes.",
  },
  {
    q: "Is my athlete data secure?",
    a: "Yes. Each athlete's data lives in isolated Cognee datasets. API routes enforce role-based access: coaches only see linked athletes, and athletes only see their own data. Authentication uses OTP-only email verification with server-side session revocation.",
  },
  {
    q: "Can I use my own LLM provider?",
    a: "Yes. PlayGraphAI supports any LiteLLM-compatible provider — OpenRouter, OpenAI, Ollama, or custom endpoints. The Cognee memory layer is model-agnostic; you configure the LLM and embedding provider via environment variables.",
  },
  {
    q: "How do I connect athletes to my coaching roster?",
    a: "Coaches generate invite codes from the dashboard. Athletes sign up separately and redeem the coach's invite code in their settings. This links the athlete's profile to the coach's roster, giving the coach access to their memory data.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-medium text-black">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingFaq() {
  return (
    <section id="faq" className="py-24 border-t border-gray-100">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="badge-new mb-4 inline-flex">FAQ</span>
          <h2 className="page-title mb-4">Frequently asked questions</h2>
          <p className="text-muted text-lg">
            Everything you need to know about PlayGraphAI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-gray-100 bg-white px-6 shadow-card"
        >
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
