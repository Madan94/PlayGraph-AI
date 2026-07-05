"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Search,
  User,
  Sparkles,
} from "lucide-react";

import { athletesApi, chatApi, type Athlete } from "@/lib/api";

export default function ChatPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteId, setAthleteId] = useState("");

  const [query, setQuery] = useState("");

  const [result, setResult] =
    useState<Awaited<ReturnType<typeof chatApi.ask>> | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    athletesApi.list().then((data) => {
      setAthletes(data.athletes);

      if (data.athletes.length) {
        setAthleteId(data.athletes[0].id);
      }
    });
  }, []);

  async function ask(question: string) {
    if (!athleteId) {
      setError("Please select an athlete.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await chatApi.ask(athleteId, question);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to process request."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEFC]">
          <MessageSquare className="h-6 w-6 text-[#2452B7]" />
        </div>

        <h1 className="font-heading text-4xl font-semibold tracking-tight text-slate-900">
          Coach Chat
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Ask questions about an athlete's performance. Responses are grounded
          using Cognee memory through <strong>recall()</strong>.
        </p>
      </div>

      {/* Chat Form */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <User className="h-4 w-4" />
            Athlete
          </label>

          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#2452B7] focus:ring-2 focus:ring-[#2452B7]/10"
          >
            <option value="">Select an athlete...</option>

            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Search className="h-4 w-4" />
            Question
          </label>

          <textarea
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: How has the athlete's batting performance changed over the last five sessions?"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#2452B7] focus:ring-2 focus:ring-[#2452B7]/10"
          />
        </div>

        <button
          onClick={() => ask(query)}
          disabled={loading || !query.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2452B7] px-5 py-3 font-medium text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />

          {loading ? "Thinking..." : "Ask Coach"}
        </button>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      {/* Response */}
      {result && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-slate-900">
              AI Response
            </h2>

            <span className="rounded-full bg-[#E8EEFC] px-3 py-1 text-xs font-semibold text-[#2452B7]">
              recall() • {result.recall.memories_used} memories
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="whitespace-pre-wrap leading-7 text-slate-700">
              {result.answer}
            </p>
          </div>

          {result.recall.sources.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 font-heading text-lg font-semibold text-slate-900">
                Supporting Evidence
              </h3>

              <div className="space-y-3">
                {result.recall.sources.slice(0, 5).map((source, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm leading-6 text-slate-600">
                      {source.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}