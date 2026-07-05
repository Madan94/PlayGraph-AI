import { AthleteSidebar } from "@/components/layout/athlete-sidebar";

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell flex min-h-screen bg-white">
      <AthleteSidebar />
      <main className="page-content flex-1 overflow-auto bg-white">{children}</main>
    </div>
  );
}
