"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { GlobalSearch } from "@/components/global-search";
import { ApplicationBreadcrumb } from "@/components/application-breadcrumb";

// The Application Details page (/applications/<job-id>) is the one page
// where the global search bar is hidden — it's a single-record detail view,
// not a browsing context, and there's nothing on it to search across. Every
// other page, including the Applications list itself (/applications), keeps
// it.
const APPLICATION_DETAIL_PAGE_RE = /^\/applications\/([^/]+)$/;

export function TopBar({
  user,
}: {
  user: { name: string; email: string; avatarUrl?: string | null };
}) {
  const pathname = usePathname();
  const detailMatch = pathname.match(APPLICATION_DETAIL_PAGE_RE);

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
      </div>

      <div className="w-96 max-w-full">
        {detailMatch ? (
          <ApplicationBreadcrumb slug={detailMatch[1]} />
        ) : (
          <GlobalSearch />
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <ThemeToggle />
        <UserMenu {...user} />
      </div>
    </header>
  );
}
