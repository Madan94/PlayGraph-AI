"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { chatApi } from "@/lib/api";

type Props = {
  athleteId: string | null | undefined;
  embedded?: boolean;
  title?: string;
  emptyMessage?: string;
  noAthleteMessage?: string;
};

export function TrainingTimeline({
  athleteId,
  embedded = false,
  title = "Training Timeline",
  emptyMessage = "No memories yet — upload a session to populate Cognee.",
  noAthleteMessage = "Select an athlete to view their training timeline.",
}: Props) {
  const [entries, setEntries] = useState<{ summary: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) {
      setEntries([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    chatApi
      .timeline(athleteId)
      .then((d) => setEntries(d.entries))
      .catch((e) => {
        setEntries([]);
        setError(e instanceof Error ? e.message : "Failed to load timeline");
      })
      .finally(() => setLoading(false));
  }, [athleteId]);

  const content = (
    <>
      {!embedded && (
        <h2 className="section-title mb-4">
          {title}{" "}
          <span className="font-mono text-xs font-normal text-brand">recall()</span>
        </h2>
      )}

      {!athleteId && (
        <p className="text-sm text-muted">{noAthleteMessage}</p>
      )}

      {athleteId && loading && <p className="text-sm text-muted">Loading memories...</p>}

      {error && <p className="alert-error text-sm">{error}</p>}

      {athleteId && !loading && !error && entries.length === 0 && (
        <p className="text-sm text-muted">{emptyMessage}</p>
      )}

      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
              <p className="text-sm leading-6 text-muted">{entry.summary.slice(0, 600)}</p>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return <div>{content}</div>;

  return <div className="card-padded">{content}</div>;
}
