import { API_URL } from "./utils";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
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

export const DEMO_ATHLETE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export interface ChatResponse {
  answer: string;
  recall: {
    query: string;
    memories_used: number;
    sources: { memory_id?: string; summary: string; session_id?: string }[];
  };
}

export const memoryApi = {
  seedDemo: () => api<{ memories_seeded: number }>("/api/v1/memory/seed-demo", { method: "POST", body: "{}" }),
  recall: (athlete_id: string, query: string) =>
    api("/api/v1/memory/recall", {
      method: "POST",
      body: JSON.stringify({ athlete_id, query }),
    }),
  stats: () => api<{ operations: Record<string, number> }>("/api/v1/memory/stats"),
};

export const chatApi = {
  ask: (athlete_id: string, message: string) =>
    api<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({ athlete_id, message }),
    }),
  timeline: (athlete_id: string) =>
    api<{ entries: { summary: string; memory_id?: string }[]; memories_used: number }>(
      `/api/v1/chat/timeline/${athlete_id}`
    ),
};

export async function downloadReport(athlete_id: string, session_id?: string) {
  const res = await fetch(`${API_URL}/api/v1/reports/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ athlete_id, session_id }),
  });
  if (!res.ok) throw new Error("Report generation failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nextplay-report.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
