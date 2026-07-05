"use client";

import { useEffect, useState } from "react";
import { athletesApi, chatApi, type Athlete } from "@/lib/api";

export default function ChatPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteId, setAthleteId] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof chatApi.ask>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    athletesApi.list().then((d) => {
      setAthletes(d.athletes);
      if (d.athletes[0]) setAthleteId(d.athletes[0].id);
    });
  }, []);

  async function ask(q: string) {
    if (!athleteId) {
      setError("Select an athlete first");
      return;
    }
    setQuery(q);
    setLoading(true);
    setError(null);
    try {
      const data = await chatApi.ask(athleteId, q);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Coach Chat</h1>
      <p className="text-foreground/50 mb-8">recall() → LLM → grounded answer</p>

      <div className="glass rounded-2xl p-4 mb-4">
        <label className="text-xs text-foreground/50 block mb-2">Athlete</label>
        <select
          value={athleteId}
          onChange={(e) => setAthleteId(e.target.value)}
          className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm mb-4 outline-none"
        >
          <option value="">Select athlete…</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent outline-none text-sm mb-3"
          placeholder="Ask about athlete performance…"
        />
        <button
          onClick={() => ask(query)}
          disabled={loading || !query.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple to-cyan text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Recalling + generating…" : "Ask Coach"}
        </button>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </div>

      {result && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-cyan px-2 py-0.5 rounded bg-cyan/10">recall()</span>
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
