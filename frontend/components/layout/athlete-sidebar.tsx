"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, Clock, Settings, Zap, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/athlete/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/athlete/upload", label: "Upload", icon: Upload },
  { href: "/athlete/timeline", label: "Timeline", icon: Clock },
  { href: "/athlete/settings", label: "Settings", icon: Settings },
];

export function AthleteSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="app-sidebar" aria-label="Athlete navigation">
      <div className="app-sidebar-header">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-black">PlayGraphAI</h2>
          <p className="text-xs text-muted">Athlete</p>
        </div>
      </div>

      <nav className="app-sidebar-nav">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
