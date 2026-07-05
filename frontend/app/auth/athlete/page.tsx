import Link from "next/link";
import { OtpAuthFlow } from "@/components/auth/otp-auth-flow";

export default function AthleteAuthPage() {
  return (
    <div className="page-shell min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm text-muted hover:text-black">← PlayGraphAI</Link>
      <OtpAuthFlow role="athlete" title="Athlete access" />
    </div>
  );
}
