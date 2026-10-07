"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Opens a .tex source directly in Overleaf's own editor via its official
 * "Open in Overleaf" integration — Overleaf does the actual LaTeX→PDF
 * compilation, so Jobstack never needs a LaTeX engine of its own. Uses the
 * POST + `encoded_snip` method (vs. `snip_uri`) since that avoids needing
 * to host the file at a public URL, which doesn't fit our private,
 * signed-URL Supabase Storage model.
 */
function openInOverleaf(texSource: string) {
  const form = document.createElement("form");
  form.action = "https://www.overleaf.com/docs";
  form.method = "post";
  form.target = "_blank";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "encoded_snip";
  input.value = encodeURIComponent(texSource);
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

export function OpenInOverleafButton({
  texSource,
  size = "sm",
  variant = "outline",
}: {
  texSource: string;
  size?: "sm" | "default";
  variant?: "outline" | "ghost";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => openInOverleaf(texSource)}
    >
      <ExternalLink className="size-3.5" />
      Open in Overleaf
    </Button>
  );
}
