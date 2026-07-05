import { CoachSidebar } from "@/components/layout/coach-sidebar";
import { AppShell } from "@/components/layout/app-shell";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <AppShell sidebar={<CoachSidebar />}>{children}</AppShell>;
}
