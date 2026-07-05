"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Search, User, Sparkles, ArrowRight } from "lucide-react";

import { chatApi } from "@/lib/api";
import { useAthletes } from "@/lib/hooks/use-athletes";
import { AthleteSelect } from "@/components/coach/athlete-select";
import { PageHeader } from "@/components/ui/page-header";

const SUGGESTIONS = [
  "How has batting performance changed over recent sessions?",
  "Summarize the last training upload.",
  "Any injury or fatigue signals in recent memories?",
];

export default function CoachChatPage() {
  const { athletes, loading: athletesLoading, error: athletesError } = useAthletes();
  const [athleteId, setAthleteId] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof chatApi.ask>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athletes.length) {
      setAthleteId("");
      return;
    }
    if (!athleteId || !athletes.some((a) => a.id === athleteId)) {
      setAthleteId(athletes[0].id);
    }
  }, [athletes, athleteId]);

  async function ask(question: string) {
    if (!athleteId) {
      setError("Select an athlete first.");
      return;
    }
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await chatApi.ask(athleteId, question.trim());
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process request.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-page-lg">
      <PageHeader
        icon={MessageSquare}
        title="Coach Chat"
        description="Ask questions about an athlete's performance. Answers are grounded in Cognee recall()."
      />

      <section className="card-padded">
        <div className="mb-5">
          <label className="field-label" htmlFor="chat-athlete">
            <User className="h-4 w-4" />
            Athlete
          </label>
          <AthleteSelect
            athletes={athletes}
            value={athleteId}
            onChange={setAthleteId}
            loading={athletesLoading}
            error={athletesError}
          />
        </div>

        <div className="mb-5">
          <label className="field-label" htmlFor="chat-question">
            <Search className="h-4 w-4" />
            Question
          </label>
          <textarea
            id="chat-question"
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                ask(query);
              }
            }}
            placeholder="Example: How has the athlete's batting performance changed over the last five sessions?"
            className="input-field resize-none"
            disabled={!athleteId || athletesLoading}
          />
          <p className="mt-2 text-xs text-muted">Press Ctrl+Enter to send</p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                ask(s);
              }}
              disabled={loading || !athleteId}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-xs text-muted transition hover:border-brand/30 hover:bg-brand-light hover:text-brand disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => ask(query)}
          disabled={loading || !query.trim() || !athleteId}
          className="btn-primary"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Thinking…" : "Ask Coach"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        {error && <div className="alert-error mt-4">{error}</div>}
      </section>

      {result && (
        <section className="card-padded">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">AI Response</h2>
            <span className="badge-brand">
              recall() • {result.recall.memories_used} memor
              {result.recall.memories_used === 1 ? "y" : "ies"}
            </span>
          </div>

          <div className="surface-muted p-5">
            <p className="whitespace-pre-wrap leading-7 text-muted">{result.answer}</p>
          </div>

          {result.recall.sources.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-black">Supporting Evidence</h3>
              <div className="space-y-3">
                {result.recall.sources.slice(0, 5).map((source, index) => (
                  <div key={index} className="surface-muted p-4">
                    <p className="text-sm leading-6 text-muted">{source.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.recall.memories_used === 0 && (
            <p className="mt-4 text-sm text-muted">
              No memories matched this question. Upload a session for this athlete first.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
