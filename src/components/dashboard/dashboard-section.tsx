import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardSection({
  title,
  viewAllHref,
  viewAllLabel = "View all",
  children,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {viewAllHref && (
          <CardAction>
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              {viewAllLabel}
              <ArrowUpRight className="size-3" />
            </Link>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-1">{children}</CardContent>
    </Card>
  );
}
