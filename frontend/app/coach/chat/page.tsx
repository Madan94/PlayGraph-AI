"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Search, User, Sparkles, ArrowRight } from "lucide-react";

import { athletesApi, chatApi, type Athlete } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";

export default function ChatPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteId, setAthleteId] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof chatApi.ask>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    athletesApi.list().then((data) => {
      setAthletes(data.athletes);
      if (data.athletes.length) setAthleteId(data.athletes[0].id);
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
      setError(err instanceof Error ? err.message : "Unable to process request.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8 lg:p-10">
      <PageHeader
        icon={MessageSquare}
        title="Coach Chat"
        description="Ask questions about an athlete's performance. Responses are grounded using Cognee memory through recall()."
      />

      <section className="card-padded">
        <div className="mb-5">
          <label className="field-label">
            <User className="h-4 w-4" />
            Athlete
          </label>
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="input-field"
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
          <label className="field-label">
            <Search className="h-4 w-4" />
            Question
          </label>
          <textarea
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: How has the athlete's batting performance changed over the last five sessions?"
            className="input-field resize-none"
          />
        </div>

        <button
          type="button"
          onClick={() => ask(query)}
          disabled={loading || !query.trim()}
          className="btn-primary"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Thinking..." : "Ask Coach"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        {error && <div className="alert-error mt-4">{error}</div>}
      </section>

      {result && (
        <section className="card-padded">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">AI Response</h2>
            <span className="badge-brand">
              recall() • {result.recall.memories_used} memories
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
        </section>
      )}
    </div>
  );
}
