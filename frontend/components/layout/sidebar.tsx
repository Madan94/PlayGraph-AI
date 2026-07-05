"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, LayoutDashboard, Upload, MessageSquare, GitBranch, Zap } from "lucide-react";
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
    <aside className="w-56 shrink-0 border-r border-white/10 bg-background flex flex-col h-screen">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-cyan flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm">Next<span className="text-purple-light">Play</span>AI</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
              pathname === href || (href.includes("/athletes") && pathname.startsWith("/athletes"))
                ? "bg-purple/15 text-purple-light border border-purple/20"
                : "text-foreground/50 hover:text-foreground hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <p className="text-[10px] text-foreground/30 px-2">Powered by Cognee</p>
      </div>
    </aside>
  );
}
