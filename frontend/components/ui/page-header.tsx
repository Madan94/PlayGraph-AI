import type { LucideIcon } from "lucide-react";

type PageHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
};

export function PageHeader({ icon: Icon, title, description, badge }: PageHeaderProps) {
  return (
    <header className="mb-8">
      {badge && <span className="badge-new mb-4 inline-flex">{badge}</span>}
      <div className="icon-badge !mb-4">
        <Icon />
      </div>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{description}</p>
    </header>
  );
}
