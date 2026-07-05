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
    <aside className="relative z-20 flex h-screen w-60 shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-black">PlayGraphAI</h2>
          <p className="text-xs text-muted">Coach</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={cn("nav-link", active && "nav-link-active")}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4 space-y-2">
        {user && (
          <p className="truncate text-xs text-muted px-1">{user.email}</p>
        )}
        <button type="button" onClick={() => logout()} className="nav-link w-full text-left">
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
