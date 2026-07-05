import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = process.env.JWT_COOKIE_NAME ?? "pg_session";
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "change-me");

const PUBLIC = ["/", "/auth/athlete", "/auth/coach"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return NextResponse.redirect(new URL("/coach/dashboard", req.url));
  }

  const legacyDashboard = ["/upload", "/chat", "/memory", "/workflow", "/athletes"];
  if (legacyDashboard.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL(`/coach${pathname}`, req.url));
  }

  const token = req.cookies.get(COOKIE)?.value;
  let role: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      role = (payload.role as string) ?? null;
    } catch {
      role = null;
    }
  }

  if (pathname === "/" && role) {
    const dest = role === "coach" ? "/coach/dashboard" : "/athlete/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (PUBLIC.includes(pathname)) {
    return NextResponse.next();
  }

  if (!token || !role) {
    const login = pathname.startsWith("/athlete") ? "/auth/athlete" : "/auth/coach";
    return NextResponse.redirect(new URL(login, req.url));
  }

  if (pathname.startsWith("/coach") && role !== "coach") {
    return NextResponse.redirect(new URL("/athlete/dashboard", req.url));
  }

  if (pathname.startsWith("/athlete") && role !== "athlete") {
    return NextResponse.redirect(new URL("/coach/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
