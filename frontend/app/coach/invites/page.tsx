"use client";

import { useEffect, useState } from "react";
import { Ticket, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { invitesApi } from "@/lib/api";

export default function CoachInvitesPage() {
  const [invites, setInvites] = useState<{ code: string; uses: number; max_uses: number }[]>([]);
  const [latest, setLatest] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    invitesApi.list().then((d) => setInvites(d.invites)).catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await invitesApi.create();
      setLatest(res.code);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create invite");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8 lg:p-10">
      <PageHeader
        icon={Ticket}
        title="Coach Invites"
        description="Generate invite codes for athletes to link to your roster after they sign up."
      />
      <section className="card-padded">
        <button type="button" onClick={generate} disabled={loading} className="btn-primary">
          {loading ? "Generating..." : "Generate Invite Code"}
        </button>
        {error && <p className="alert-error mt-4">{error}</p>}
        {latest && (
          <div className="surface-muted mt-6 flex items-center justify-between p-4">
            <code className="text-lg font-bold tracking-widest text-brand">{latest}</code>
            <button type="button" onClick={() => copyCode(latest)} className="btn-secondary">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy
            </button>
          </div>
        )}
        {invites.length > 0 && (
          <ul className="mt-8 space-y-2">
            {invites.map((inv) => (
              <li key={inv.code} className="flex justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm">
                <code className="font-mono text-brand">{inv.code}</code>
                <span className="text-muted">{inv.uses}/{inv.max_uses} uses</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
