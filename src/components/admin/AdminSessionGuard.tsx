"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Belt-and-suspenders: if middleware is bypassed or the session expires,
 * redirect before showing admin tools.
 */
export function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch("/api/admin/auth/me", { cache: "no-store" });
        if (!res.ok) {
          const next = encodeURIComponent(pathname || "/admin");
          router.replace(`/login?next=${next}`);
          return;
        }
        if (!cancelled) setReady(true);
      } catch {
        router.replace("/login");
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center text-sm text-slate-500">
        Verifying session…
      </div>
    );
  }

  return <>{children}</>;
}
