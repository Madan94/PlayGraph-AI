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
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/memory",
    label: "Memory",
    icon: Brain,
  },
  {
    href: "/upload",
    label: "Upload",
    icon: Upload,
  },
  {
    href: "/chat",
    label: "Coach Chat",
    icon: MessageSquare,
  },
  {
    href: "/workflow",
    label: "Workflow",
    icon: GitBranch,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2452B7] shadow-sm">
          <Zap className="h-5 w-5 text-white" />
        </div>

        <div>
          <h2 className="font-heading text-base font-semibold text-slate-900">
            PlayGraphAI
          </h2>

          <p className="text-xs text-slate-500">
            Athlete Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href.includes("/athletes") &&
              pathname.startsWith("/athletes"));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[#2452B7] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-700"
                )}
              />

              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Powered by
          </p>

          <p className="mt-1 font-medium text-slate-700">
            Cognee
          </p>
        </div>
      </div>
    </aside>
  );
}