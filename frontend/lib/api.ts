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

export interface Athlete {
  id: string;
  name: string;
  sport: string;
  metadata: Record<string, unknown>;
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

export const athletesApi = {
  list: () => api<{ athletes: Athlete[] }>("/api/v1/athletes"),
  get: (id: string) => api<Athlete>(`/api/v1/athletes/${id}`),
  create: (body: CreateAthleteInput) =>
    api<Athlete>("/api/v1/athletes", {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        sport: body.sport ?? "athletics",
        metadata: body.metadata ?? {},
      }),
    }),
};

export const memoryApi = {
  recall: (athlete_id: string, query: string) =>
    api("/api/v1/memory/recall", {
      method: "POST",
      body: JSON.stringify({ athlete_id, query }),
    }),
  stats: () => api<{ operations: Record<string, number>; cognee_dataset: string }>("/api/v1/memory/stats"),
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
