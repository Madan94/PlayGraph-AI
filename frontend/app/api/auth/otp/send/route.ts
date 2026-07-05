import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, purpose, role } = body;

    if (!email || !purpose || !role) {
      return NextResponse.json({ detail: "email, purpose, and role are required" }, { status: 400 });
    }

    const res = await backendFetch("/api/v1/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ email, purpose, role }),
      internal: true,
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    if (!data.otp_code) {
      return NextResponse.json({ detail: "OTP delivery failed" }, { status: 500 });
    }

    await sendOtpEmail(email, data.otp_code, role);
    return NextResponse.json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
