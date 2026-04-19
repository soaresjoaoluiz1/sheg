import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
      <div className="grid size-12 place-items-center rounded-xl bg-muted mx-auto">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
