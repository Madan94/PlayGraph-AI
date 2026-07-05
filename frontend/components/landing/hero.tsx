"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,102,255,0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(0,102,255,0.06),transparent_50%)]" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="badge-new mb-6 inline-flex"
        >
          Memory-first athlete intelligence
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-semibold leading-[1.1] tracking-tight text-black md:text-[3.5rem] lg:text-6xl"
        >
          The AI memory layer for{" "}
          <span className="gradient-text">elite athlete</span>{" "}
          development.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted"
        >
          PlayGraphAI ingests video, wearables, and session data into a persistent knowledge graph —
          then powers coach chat, timelines, and reports with long-term recall.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/auth/coach" className="btn-primary px-8 py-3 text-base">
            Start as Coach <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/auth/athlete" className="btn-secondary px-8 py-3 text-base">
            I&apos;m an Athlete
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-auto mt-16 max-w-lg rounded-xl border border-gray-200 bg-gray-50/80 px-5 py-3.5 font-mono text-sm text-muted backdrop-blur-sm"
        >
          <span className="text-brand">$</span> cognee.remember(session) <span className="text-gray-400">→</span> recall() <span className="text-gray-400">→</span> coach insights
        </motion.div>
      </div>
    </section>
  );
}
