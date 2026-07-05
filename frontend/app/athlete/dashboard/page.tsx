"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui/page-header";
import { TrainingTimeline } from "@/components/athletes/training-timeline";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function AthleteDashboardPage() {
  const { user, refresh } = useAuth();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="app-page-md">
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome${user?.full_name ? `, ${user.full_name}` : ""}`}
        description="Your performance memory hub. Upload sessions and track your training timeline."
      />

      <TrainingTimeline
        athleteId={user?.athlete_id}
        emptyMessage="No memories yet. Upload a session or ask your coach to link your roster profile via invite code."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/athlete/upload" className="card-padded transition hover:shadow-soft">
          <h2 className="section-title text-lg">Upload Session</h2>
          <p className="section-subtitle">Send video, images, audio, or notes to your memory graph.</p>
        </Link>
        <Link href="/athlete/timeline" className="card-padded transition hover:shadow-soft">
          <h2 className="section-title text-lg">Full Timeline</h2>
          <p className="section-subtitle">Open the dedicated timeline view for your full training history.</p>
        </Link>
      </div>
    </div>
  );
}
