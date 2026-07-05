import { CoachSidebar } from "@/components/layout/coach-sidebar";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell flex min-h-screen bg-white">
      <CoachSidebar />
      <main className="page-content flex-1 overflow-auto bg-white">{children}</main>
    </div>
  );
}
