import { api } from "./client";
import { TokenResponse } from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    api<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};
