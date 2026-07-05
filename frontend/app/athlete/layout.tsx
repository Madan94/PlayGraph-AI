import { AthleteSidebar } from "@/components/layout/athlete-sidebar";
import { AppShell } from "@/components/layout/app-shell";

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebar={<AthleteSidebar />}>{children}</AppShell>;
}
