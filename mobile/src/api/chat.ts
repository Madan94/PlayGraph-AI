import { api } from "./client";
import { ChatResponse, TimelineResponse } from "./types";

export const chatApi = {
  ask: (athlete_id: string, message: string) =>
    api<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({ athlete_id, message }),
    }),
  timeline: (athlete_id: string) => api<TimelineResponse>(`/api/v1/chat/timeline/${athlete_id}`),
};
