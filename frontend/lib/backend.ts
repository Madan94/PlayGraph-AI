const BACKEND_URL = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8002").replace(/\/$/, "");
const INTERNAL_KEY = process.env.AUTH_INTERNAL_SERVICE_KEY ?? "";

export function backendUrl(path: string): string {
  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function backendFetch(
  path: string,
  init: RequestInit & { internal?: boolean } = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const body = init.body;
  if (
    !headers.has("Content-Type") &&
    body &&
    !(body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (init.internal && INTERNAL_KEY) {
    headers.set("X-Internal-Key", INTERNAL_KEY);
  }

  const fetchInit: RequestInit & { duplex?: "half" } = { ...init, headers };
  if (body instanceof ReadableStream) {
    fetchInit.duplex = "half";
  }

  return fetch(backendUrl(path), fetchInit);
}

export const AUTH_COOKIE = process.env.JWT_COOKIE_NAME ?? "pg_session";
export const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";
export const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE ?? "lax") as "lax" | "strict" | "none";
