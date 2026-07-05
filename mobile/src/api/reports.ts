import { API_URL } from "@/config/env";
import { getAuthToken } from "./tokenStore";
import { ApiError } from "./client";

export const reportsApi = {
  generate: async (athlete_id: string, session_id?: string): Promise<{ message: string }> => {
    const token = getAuthToken();
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/v1/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ athlete_id, session_id }),
      });
    } catch {
      throw new ApiError("Can't reach the server", 0, true);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let detail = text;
      try { detail = JSON.parse(text).detail ?? text; } catch { /* plain text */ }
      throw new ApiError(detail || res.statusText, res.status);
    }
    const bytes = await res.arrayBuffer();
    const kb = Math.round(bytes.byteLength / 1024);
    return { message: `Report generated (${kb} KB) — ${new Date().toLocaleTimeString()}` };
  },
};
