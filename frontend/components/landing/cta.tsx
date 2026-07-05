"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-black px-8 py-16 text-center sm:px-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(0,102,255,0.3),transparent)]" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to give your athletes a memory?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-400">
              Start building persistent athlete intelligence today.
              Free for athletes, instant setup for coaches.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/coach"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-8 py-3 font-medium text-white transition hover:bg-brand-hover"
              >
                Start as Coach <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/athlete"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-transparent px-8 py-3 font-medium text-white transition hover:border-gray-500"
              >
                Join as Athlete
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
