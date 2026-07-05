"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { chatApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AthleteTimelinePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<{ summary: string }[]>([]);

  useEffect(() => {
    if (!user?.athlete_id) return;
    chatApi.timeline(user.athlete_id).then((d) => setEntries(d.entries)).catch(() => {});
  }, [user?.athlete_id]);

  return (
    <div className="mx-auto max-w-3xl p-8 lg:p-10">
      <PageHeader icon={Clock} title="Training Timeline" description="Memories recalled from your Cognee athlete dataset." />
      <div className="card-padded space-y-4">
        {entries.length === 0 ? (
          <p className="text-muted">No memories yet. Upload a session to get started.</p>
        ) : (
          entries.map((e, i) => (
            <div key={i} className="surface-muted p-4 text-sm text-muted leading-6">
              {e.summary.slice(0, 600)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
