"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  Upload,
  MessageSquare,
  GitBranch,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/chat", label: "Coach Chat", icon: MessageSquare },
  { href: "/workflow", label: "Workflow", icon: GitBranch },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-20 flex h-screen w-60 shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
        <div>
          <h2 className="text-sm font-semibold text-black">PlayGraphAI</h2>
          <p className="text-xs text-muted">Athlete Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href.includes("/athletes") && pathname.startsWith("/athletes"));

          return (
            <Link
              key={href}
              href={href}
              className={cn("nav-link", active && "nav-link-active")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
          <p className="text-xs text-muted">Powered by</p>
          <p className="mt-0.5 text-sm font-medium text-black">Cognee</p>
        </div>
      </div>
    </aside>
  );
}
