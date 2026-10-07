import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-5">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Image src="/logo-jobstack.png" alt="" width={32} height={32} className="size-8 rounded-lg" />
          <span className="text-sm font-semibold">Jobstack</span>
        </Link>
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
