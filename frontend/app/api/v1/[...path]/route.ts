import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, backendFetch } from "@/lib/backend";

async function proxy(req: NextRequest, path: string) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const url = new URL(req.url);
  const search = url.search;

  const headers = new Headers();
  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const internalKey = process.env.AUTH_INTERNAL_SERVICE_KEY;
  if (path.includes("/memory/ingest") && internalKey) {
    headers.set("X-Internal-Key", internalKey);
  }

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (isMultipart) {
      // Stream through with original boundary — avoid parsing/rebuilding large FormData in Node.
      if (contentType) headers.set("Content-Type", contentType);
      const contentLength = req.headers.get("content-length");
      if (contentLength) headers.set("Content-Length", contentLength);
      body = req.body ?? undefined;
    } else {
      if (contentType) headers.set("Content-Type", contentType);
      body = await req.arrayBuffer();
    }
  }

  const res = await backendFetch(`/api/v1/${path}${search}`, {
    method: req.method,
    headers,
    body,
  });

  const responseHeaders = new Headers();
  const resType = res.headers.get("content-type");
  if (resType) responseHeaders.set("Content-Type", resType);
  const disposition = res.headers.get("content-disposition");
  if (disposition) responseHeaders.set("Content-Disposition", disposition);

  return new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path.join("/"));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path.join("/"));
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path.join("/"));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path.join("/"));
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path.join("/"));
}
