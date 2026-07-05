import { api } from "./client";
import { Athlete, AthleteListResponse } from "./types";

export const athletesApi = {
  list: () =>
    api<AthleteListResponse>("/api/v1/athletes"),

  get: (athleteId: string) =>
    api<Athlete>(`/api/v1/athletes/${athleteId}`),

  create: (name: string, sport: string) =>
    api<Athlete>("/api/v1/athletes", {
      method: "POST",
      body: JSON.stringify({ name, sport }),
    }),
};
