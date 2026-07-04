import { api } from "./client";

export const memoryApi = {
  recall: (athlete_id: string, query: string, limit = 10) =>
    api("/api/v1/memory/recall", {
      method: "POST",
      body: JSON.stringify({ athlete_id, query, limit }),
    }),
  seedDemo: (athlete_id: string) =>
    api<{ status: string; memories_seeded: number }>("/api/v1/memory/seed-demo", {
      method: "POST",
      body: JSON.stringify({ athlete_id }),
    }),
};
