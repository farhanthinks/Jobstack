import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed py-14 text-center">
      <Icon className="size-4 text-muted-foreground" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
