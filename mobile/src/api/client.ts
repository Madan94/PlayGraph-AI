import { API_URL } from "@/config/env";
import { getAuthToken } from "./tokenStore";

export class ApiError extends Error {
  status: number;
  isNetworkError: boolean;

  constructor(message: string, status: number, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (e) {
    throw new ApiError(
      "Can't reach the NextPlayAI server. Check your connection and API URL.",
      0,
      true
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.detail ?? text;
    } catch {
      // plain text error body
    }
    throw new ApiError(detail || res.statusText, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
