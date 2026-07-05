"use client";

import Link from "next/link";
import { User } from "lucide-react";
import type { Athlete } from "@/lib/api";

type Props = {
  athletes: Athlete[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  emptyHint?: string;
  className?: string;
  showSport?: boolean;
};

export function AthleteSelect({
  athletes,
  value,
  onChange,
  loading = false,
  error = null,
  emptyHint = "Create an athlete on the dashboard first.",
  className = "input-field",
  showSport = true,
}: Props) {
  if (loading) {
    return <p className="text-sm text-muted">Loading athletes…</p>;
  }

  if (error) {
    return <p className="alert-error text-sm">{error}</p>;
  }

  if (athletes.length === 0) {
    return (
      <div className="surface-muted flex items-start gap-3 p-4 text-sm text-muted">
        <User className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium text-black">No athletes yet</p>
          <p className="mt-1">{emptyHint}</p>
          <Link href="/coach/dashboard" className="mt-2 inline-block text-brand hover:underline">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Select an athlete…</option>
      {athletes.map((athlete) => (
        <option key={athlete.id} value={athlete.id}>
          {showSport ? `${athlete.name} — ${athlete.sport}` : athlete.name}
        </option>
      ))}
    </select>
  );
}
