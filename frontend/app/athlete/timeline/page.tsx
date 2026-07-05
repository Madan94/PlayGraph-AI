"use client";

import { useEffect } from "react";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TrainingTimeline } from "@/components/athletes/training-timeline";
import { useAuth } from "@/lib/auth-context";

export default function AthleteTimelinePage() {
  const { user, refresh } = useAuth();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="app-page-sm">
      <PageHeader
        icon={Clock}
        title="Training Timeline"
        description="Memories recalled from your Cognee athlete dataset."
      />
      <TrainingTimeline
        athleteId={user?.athlete_id}
        emptyMessage="No memories yet. Upload a session to get started."
      />
    </div>
  );
}
