import { api } from "./client";
import { MemoryStats } from "./types";

const SEED_SUMMARIES = [
  "Batting session: Strike rate improved to 150 over last 5 weeks. Strong cover drive, improving pull shot against short-pitch deliveries.",
  "Fitness test: Sprint speed 28.9 km/h, up 6% from last month. Agility drills showing significant improvement.",
  "Match highlights: Scored 78 runs vs Mumbai XI. Pulled off 3 consecutive boundaries in over 14. Excellent running between wickets.",
  "Training note: Needs work on yorker defense. Coach recommends 30min daily drill at crease with varied delivery lengths.",
  "Injury log: Minor hamstring tightness in left leg after intense sprint session. Physio cleared for full training after 2 days rest.",
];

export const memoryApi = {
  recall: (athlete_id: string, query: string, limit = 10) =>
    api("/api/v1/memory/recall", {
      method: "POST",
      body: JSON.stringify({ athlete_id, query, limit }),
    }),

  seedDemo: async (athlete_id: string): Promise<{ status: string; memories_seeded: number }> => {
    // Create a seed session first (required for the session_id FK in memory_operations_log)
    const session = await api<{ id: string; status: string }>("/api/v1/sessions", {
      method: "POST",
      body: JSON.stringify({
        athlete_id,
        title: "Demo Seed Session",
        type: "training",
        sport: "cricket",
      }),
    });
    let seeded = 0;
    for (const summary of SEED_SUMMARIES) {
      await api("/api/v1/memory/remember", {
        method: "POST",
        body: JSON.stringify({
          athlete_id,
          session_id: session.id,
          summary,
          memory_type: "performance_metric",
          source_worker: "demo_seed",
        }),
      });
      seeded++;
    }
    return { status: "ok", memories_seeded: seeded };
  },

  improve: (athlete_id: string) =>
    api<{ status: string; operation: string }>(`/api/v1/memory/improve/${athlete_id}`, {
      method: "POST",
    }),

  stats: () =>
    api<MemoryStats>("/api/v1/memory/stats"),
};
