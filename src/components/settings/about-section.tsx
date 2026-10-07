import Image from "next/image";

import packageJson from "../../../package.json";
import { Separator } from "@/components/ui/separator";

export function AboutSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">About</h2>
        <p className="text-sm text-muted-foreground">Jobstack details and support.</p>
      </div>

      <div className="flex items-center gap-3">
        <Image src="/logo-jobstack.png" alt="" width={40} height={40} className="size-10 rounded-lg" />
        <div>
          <p className="text-sm font-semibold">Jobstack</p>
          <p className="text-xs text-muted-foreground">Version {packageJson.version}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium">Help &amp; Support</p>
          <p className="text-xs text-muted-foreground">
            No support channel is set up yet — this is a placeholder section
            until one exists.
          </p>
        </div>
        <div>
          <p className="font-medium">Terms of Service</p>
          <p className="text-xs text-muted-foreground">
            Not yet written. This section is a placeholder.
          </p>
        </div>
        <div>
          <p className="font-medium">Privacy Policy</p>
          <p className="text-xs text-muted-foreground">
            Jobstack stores only the data you enter — see Data &amp; Privacy
            for an export/delete overview. A full privacy policy document
            hasn&apos;t been written yet.
          </p>
        </div>
      </div>
    </div>
  );
}
