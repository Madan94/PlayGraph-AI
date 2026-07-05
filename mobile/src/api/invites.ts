import { api } from "./client";
import { CreateInviteResponse, InviteListResponse } from "./types";

export const invitesApi = {
  create: () =>
    api<CreateInviteResponse>("/api/v1/invites", { method: "POST" }),

  list: () =>
    api<InviteListResponse>("/api/v1/invites"),

  redeem: (code: string) =>
    api<{ ok: boolean; message?: string; coach_id?: string }>("/api/v1/invites/redeem", {
      method: "POST",
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    }),
};
