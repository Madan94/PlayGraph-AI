"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { invitesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AthleteSettingsPage() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function redeem() {
    if (!code.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await invitesApi.redeem(code.trim());
      setMessage("Successfully linked to your coach.");
      setCode("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Invalid invite code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8 lg:p-10">
      <PageHeader icon={Settings} title="Settings" description="Manage your athlete profile and coach connections." />
      <section className="card-padded space-y-6">
        <div>
          <p className="text-sm text-muted">Signed in as</p>
          <p className="font-medium text-black">{user?.email}</p>
        </div>
        <div>
          <label className="field-label">Coach invite code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter 8-character code"
            className="input-field mb-3"
          />
          <button type="button" onClick={redeem} disabled={loading || !code.trim()} className="btn-primary">
            {loading ? "Linking..." : "Link Coach"}
          </button>
          {message && <p className="mt-3 text-sm text-muted">{message}</p>}
        </div>
      </section>
    </div>
  );
}
