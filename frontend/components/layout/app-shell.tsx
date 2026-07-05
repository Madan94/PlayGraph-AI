import type { ReactNode } from "react";

type Props = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, children }: Props) {
  return (
    <div className="app-shell">
      {sidebar}
      <main className="app-main">{children}</main>
    </div>
  );
}
