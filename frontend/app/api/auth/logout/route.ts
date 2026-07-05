import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, backendFetch, COOKIE_SAMESITE, COOKIE_SECURE } from "@/lib/backend";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (token) {
    await backendFetch("/api/v1/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: "/",
    maxAge: 0,
  });
  return response;
}
