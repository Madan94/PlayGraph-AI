"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

type Step = "email" | "otp" | "profile";

type Props = {
  role: "athlete" | "coach";
  title: string;
};

export function OtpAuthFlow({ role, title }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [sport, setSport] = useState("Cricket");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp() {
    setLoading(true);
    setError(null);
    try {
      await authApi.sendOtp({ email, purpose: mode, role });
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup" && step === "otp" && role === "athlete") {
        setStep("profile");
        setLoading(false);
        return;
      }
      if (mode === "signup" && step === "otp" && role === "coach" && !fullName.trim()) {
        setStep("profile");
        setLoading(false);
        return;
      }

      const { user } = await authApi.verifyOtp({
        email,
        code,
        purpose: mode,
        role,
        full_name: fullName.trim() || undefined,
        sport: role === "athlete" ? sport : undefined,
      });

      router.push(user.role === "coach" ? "/coach/dashboard" : "/athlete/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="page-title mb-2 text-3xl">{title}</h1>
      <p className="page-subtitle mb-8">
        {mode === "signup" ? "Create your account" : "Sign in"} with a one-time email code.
      </p>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => { setMode("signup"); setStep("email"); setError(null); }}
          className={mode === "signup" ? "btn-primary flex-1" : "btn-secondary flex-1"}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => { setMode("login"); setStep("email"); setError(null); }}
          className={mode === "login" ? "btn-primary flex-1" : "btn-secondary flex-1"}
        >
          Log in
        </button>
      </div>

      <div className="card-padded space-y-4">
        {step === "email" && (
          <>
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
            <button type="button" onClick={sendOtp} disabled={loading || !email} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send code <ArrowRight className="h-4 w-4" /></>}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <label className="field-label">Verification code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="input-field text-center text-2xl tracking-[0.5em]"
              placeholder="000000"
              maxLength={6}
            />
            <button type="button" onClick={verify} disabled={loading || code.length < 6} className="btn-primary w-full">
              {loading ? "Verifying..." : "Continue"}
            </button>
            <button type="button" onClick={() => setStep("email")} className="text-sm text-muted hover:text-black w-full">
              Change email
            </button>
          </>
        )}

        {step === "profile" && mode === "signup" && (
          <>
            <label className="field-label">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
            {role === "athlete" && (
              <>
                <label className="field-label">Sport</label>
                <input value={sport} onChange={(e) => setSport(e.target.value)} className="input-field" />
              </>
            )}
            <button type="button" onClick={verify} disabled={loading || !fullName.trim()} className="btn-primary w-full">
              {loading ? "Creating account..." : "Complete signup"}
            </button>
          </>
        )}

        {error && <p className="alert-error">{error}</p>}
      </div>
    </div>
  );
}
