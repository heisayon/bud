"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === "/auth";
    const isPublicRoute =
      pathname === "/" ||
      pathname === "/integrations/spotify" ||
      pathname === "/integrations/youtube";
    const isProtectedRoute = !isAuthRoute && !isPublicRoute;

    if (isAuthRoute && user) {
      router.replace("/dashboard");
      return;
    }

    if (isProtectedRoute && !user) {
      router.replace("/auth");
      return;
    }

    if (isProtectedRoute && user) {
      const handlePopState = () => {
        window.history.pushState(null, "", pathname);
      };

      window.history.pushState(null, "", pathname);

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [user, loading, pathname, router]);

  if (loading && pathname !== "/integrations/spotify" && pathname !== "/integrations/youtube") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,12,24,0.75)] px-4">
        <div className="glass w-full max-w-sm rounded-2xl p-6 text-center animate-fade-in">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)]">
            <div className="spinner" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            welcome to bud
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            getting things ready...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
