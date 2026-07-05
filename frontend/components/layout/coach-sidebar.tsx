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
  Ticket,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/memory", label: "Memory", icon: Brain },
  { href: "/coach/upload", label: "Upload", icon: Upload },
  { href: "/coach/chat", label: "Coach Chat", icon: MessageSquare },
  { href: "/coach/workflow", label: "Workflow", icon: GitBranch },
  { href: "/coach/invites", label: "Invites", icon: Ticket },
];

export function CoachSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="app-sidebar" aria-label="Coach navigation">
      <div className="app-sidebar-header">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-black">PlayGraphAI</h2>
          <p className="text-xs text-muted">Coach</p>
        </div>
      </div>

      <nav className="app-sidebar-nav">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (href === "/coach/dashboard" && pathname.startsWith("/coach/athletes/"));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn("nav-link", active && "nav-link-active")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-sidebar-footer">
        {user && <p className="truncate px-1 text-xs text-muted">{user.email}</p>}
        <button type="button" onClick={() => logout()} className="nav-link w-full text-left">
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
