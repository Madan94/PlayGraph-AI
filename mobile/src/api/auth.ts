import { api } from "./client";
import { TokenResponse, UserProfile } from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    api<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    api<void>("/api/v1/auth/logout", { method: "POST" }),

  me: () =>
    api<UserProfile>("/api/v1/auth/me"),
};
