import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, backendFetch, COOKIE_SAMESITE, COOKIE_SECURE } from "@/lib/backend";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await backendFetch("/api/v1/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ detail: text || "Backend error" }, { status: res.status });
  }
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const response = NextResponse.json({
    user: data.user,
    ok: true,
  });

  response.cookies.set(AUTH_COOKIE, data.access_token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}
