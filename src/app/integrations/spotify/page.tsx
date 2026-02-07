"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/firebase/auth-context";

function SpotifyCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState("connecting to spotify...");

  useEffect(() => {
    const run = async () => {
      const code = params.get("code");
      const state = params.get("state");
      const savedState = sessionStorage.getItem("spotify_state");
      const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

      if (!code || !state || state !== savedState || !redirectUri) {
        setStatus("invalid spotify response.");
        return;
      }

      if (!user) {
        setStatus("sign in required.");
        return;
      }

      const idToken = await user.getIdToken();
      const response = await fetch("/api/spotify/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ code, redirectUri }),
      });

      if (!response.ok) {
        setStatus("spotify connection failed.");
        return;
      }

      setStatus("spotify connected. redirecting...");
      setTimeout(() => router.push("/dashboard"), 1000);
    };

    run().catch(() => setStatus("spotify connection failed."));
  }, [params, router, user]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6">
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-sm text-[var(--muted)]">{status}</p>
      </div>
    </div>
  );
}

export default function SpotifyCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6">
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-[var(--muted)]">connecting to spotify...</p>
          </div>
        </div>
      }
    >
      <SpotifyCallbackInner />
    </Suspense>
  );
}
