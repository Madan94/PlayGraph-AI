import { API_URL } from "./utils";

/** Browser calls same-origin BFF proxy; server components may use API_URL directly. */
export const CLIENT_API_BASE = typeof window !== "undefined" ? "/api/v1" : `${API_URL}/api/v1`;

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${CLIENT_API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: isFormData
      ? { ...options?.headers }
      : {
          "Content-Type": "application/json",
          ...options?.headers,
        },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json();
}

export interface Athlete {
  id: string;
  name: string;
  sport: string;
  metadata: Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  athlete_id?: string | null;
}

export interface ChatResponse {
  answer: string;
  recall: {
    query: string;
    memories_used: number;
    sources: { memory_id?: string; summary: string; session_id?: string }[];
  };
}

export interface CreateAthleteInput {
  name: string;
  sport?: string;
  metadata?: Record<string, unknown>;
}

export const authApi = {
  sendOtp: (body: { email: string; purpose: "signup" | "login"; role: "athlete" | "coach" }) =>
    fetch("/api/auth/otp/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to send OTP");
      return data;
    }),

  verifyOtp: (body: {
    email: string;
    code: string;
    purpose: "signup" | "login";
    role: "athlete" | "coach";
    full_name?: string;
    sport?: string;
  }) =>
    fetch("/api/auth/otp/verify", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Verification failed");
      return data as { user: AuthUser; ok: boolean };
    }),

  me: () => api<AuthUser>("/auth/me").catch(() => null as AuthUser | null),
  logout: () =>
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }),
  completeOnboarding: (body: { full_name: string; sport?: string }) =>
    api<AuthUser>("/auth/onboarding", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const athletesApi = {
  list: () => api<{ athletes: Athlete[] }>("/athletes"),
  get: (id: string) => api<Athlete>(`/athletes/${id}`),
  create: (body: CreateAthleteInput) =>
    api<Athlete>("/athletes", {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        sport: body.sport ?? "athletics",
        metadata: body.metadata ?? {},
      }),
    }),
};

export const invitesApi = {
  create: () => api<{ code: string; expires_at: string | null; max_uses: number }>("/invites", { method: "POST" }),
  list: () => api<{ invites: { code: string; uses: number; max_uses: number }[] }>("/invites"),
  redeem: (code: string) =>
    api<{ ok: boolean }>("/invites/redeem", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};

export const memoryApi = {
  recall: (athlete_id: string, query: string) =>
    api("/memory/recall", {
      method: "POST",
      body: JSON.stringify({ athlete_id, query }),
    }),
  stats: () => api<{ operations: Record<string, number>; cognee_dataset: string }>("/memory/stats"),
};

export const chatApi = {
  ask: (athlete_id: string, message: string) =>
    api<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ athlete_id, message }),
    }),
  timeline: (athlete_id: string) =>
    api<{ entries: { summary: string; memory_id?: string }[]; memories_used: number }>(
      `/chat/timeline/${athlete_id}`
    ),
};

export async function downloadReport(athlete_id: string, session_id?: string) {
  const res = await fetch(`${CLIENT_API_BASE}/reports/generate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ athlete_id, session_id }),
  });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "playgraph-report.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

export async function createSessionAndUpload(
  athleteId: string,
  sport: string,
  description: string,
  file: File
) {
  const session = await api<{ id: string }>("/sessions", {
    method: "POST",
    body: JSON.stringify({
      athlete_id: athleteId,
      title: `Session — ${new Date().toLocaleDateString()}`,
      type: "training",
      sport,
      description: description.trim() || null,
    }),
  });

  const assetType =
    file.type.startsWith("video") || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name)
      ? "video"
      : "json";

  const form = new FormData();
  form.append("asset_type", assetType);
  form.append("file", file, file.name);

  const res = await fetch(`${CLIENT_API_BASE}/sessions/${session.id}/assets`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Upload failed");
  }
  return res.json();
}
