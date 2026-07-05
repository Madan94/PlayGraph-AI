"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui/page-header";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function AthleteDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl p-8 lg:p-10">
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome${user?.full_name ? `, ${user.full_name}` : ""}`}
        description="Your performance memory hub. Upload sessions and track your training timeline."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/athlete/upload" className="card-padded transition hover:shadow-soft">
          <h2 className="section-title text-lg">Upload Session</h2>
          <p className="section-subtitle">Send video or wearable data to your coach&apos;s memory graph.</p>
        </Link>
        <Link href="/athlete/timeline" className="card-padded transition hover:shadow-soft">
          <h2 className="section-title text-lg">View Timeline</h2>
          <p className="section-subtitle">See recalled memories from your training history.</p>
        </Link>
      </div>
    </div>
  );
}
