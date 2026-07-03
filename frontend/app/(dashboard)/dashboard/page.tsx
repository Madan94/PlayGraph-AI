"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { memoryApi } from "@/lib/api";
import { LiveMemoryPanel } from "@/components/memory/live-memory-panel";

export default function DashboardPage() {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  async function handleSeed() {
    setSeeding(true);
    try {
      await memoryApi.seedDemo();
      setSeeded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-foreground/50 mb-8">Memory-first intelligence for elite cricket performance</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-8 h-8 text-purple-light" />
              <div>
                <h2 className="font-semibold">Cognee Brain</h2>
                <p className="text-xs text-foreground/50">Central intelligence layer</p>
              </div>
            </div>
            <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
              Every insight flows through remember(), recall(), improve(), and forget().
              Remove Cognee — lose all intelligence.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple to-cyan text-sm font-medium disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {seeding ? "Seeding…" : seeded ? "Re-seed Demo" : "Seed Demo Memories"}
              </button>
              <Link
                href="/upload"
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm hover:bg-white/10"
              >
                <Upload className="w-4 h-4" />
                Upload Session
              </Link>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-3">Demo Athlete</h3>
            <Link href="/athletes/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center font-bold">
                RS
              </div>
              <div>
                <p className="font-medium">Rahul Sharma</p>
                <p className="text-xs text-foreground/50">Cricket · Batsman · Apex United</p>
              </div>
            </Link>
          </div>
        </div>

        <LiveMemoryPanel />
      </div>
    </div>
  );
}
