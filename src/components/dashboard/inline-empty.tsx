import Link from "next/link";

/**
 * A section with no data renders this instead of its Card — a single line,
 * not a bordered container — so empty sections never reserve large blank
 * space in the dashboard grid.
 */
export function InlineEmpty({
  message,
  href,
  linkLabel,
}: {
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <p className="px-1 py-1.5 text-sm text-muted-foreground">
      {message} ·{" "}
      <Link href={href} className="font-medium text-foreground hover:text-primary">
        {linkLabel}
      </Link>
    </p>
  );
}
