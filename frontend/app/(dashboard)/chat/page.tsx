"use client";

import { useState } from "react";
import { chatApi, DEMO_ATHLETE_ID } from "@/lib/api";

export default function ChatPage() {
  const [query, setQuery] = useState("How has Rahul improved?");
  const [result, setResult] = useState<Awaited<ReturnType<typeof chatApi.ask>> | null>(null);
  const [loading, setLoading] = useState(false);

  const DEMO_QUERIES = [
    "How has Rahul improved?",
    "What injuries affected performance?",
    "Compare last five matches.",
    "What drills should Rahul practice?",
  ];

  async function ask(q: string) {
    setQuery(q);
    setLoading(true);
    try {
      const data = await chatApi.ask(DEMO_ATHLETE_ID, q);
      setResult(data);
    } catch {
      setResult({
        answer: "Failed — ensure backend and Cognee are running. Seed demo memories first.",
        recall: { query: q, memories_used: 0, sources: [] },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Coach Chat</h1>
      <p className="text-foreground/50 mb-8">recall() → Qwen LLM → grounded answer</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {DEMO_QUERIES.map((q) => (
          <button key={q} onClick={() => ask(q)} className="text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10">
            {q}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent outline-none text-sm mb-3"
          placeholder="Ask about athlete performance…"
        />
        <button
          onClick={() => ask(query)}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple to-cyan text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Recalling + generating…" : "Ask Coach"}
        </button>
      </div>

      {result && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-cyan px-2 py-0.5 rounded bg-cyan/10">recall()</span>
            <span className="text-foreground/40">→</span>
            <span className="font-mono text-purple-light px-2 py-0.5 rounded bg-purple/10">Qwen LLM</span>
            <span className="text-foreground/50">· {result.recall.memories_used} memories</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
          {result.recall.sources.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-foreground/40 mb-2">Evidence from Cognee memory:</p>
              {result.recall.sources.slice(0, 4).map((s, i) => (
                <p key={i} className="text-[10px] text-foreground/50 mb-1.5 pl-2 border-l-2 border-emerald/30">
                  {s.summary.slice(0, 150)}{s.summary.length > 150 ? "…" : ""}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
