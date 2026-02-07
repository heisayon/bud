"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/auth-context";
import { auth, db, googleProvider } from "@/lib/firebase/client";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [platform, setPlatform] = useState<"spotify" | "youtube_music">("spotify");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const upsertUser = async (user: {
    uid: string;
    displayName: string | null;
    email: string | null;
  }) => {
    await setDoc(
      doc(db, "users", user.uid),
      {
        userId: user.uid,
        displayName: user.displayName ?? "bud listener",
        email: user.email ?? "",
        preferredPlatform: platform,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setShowAuthOverlay(true);
    setStatus("signing in...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await upsertUser(result.user);
      setStatus("redirecting...");
      router.replace("/dashboard");
    } catch (error) {
      setStatus("sign in failed.");
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 sm:px-6">
        <div className="spinner" />
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
          loading...
        </p>
      </div>
    );
  }

  // Don't render auth page if user is logged in
  if (user) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-16">
      {showAuthOverlay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,12,24,0.75)] px-4">
          <div className="glass w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)]">
              {isLoading ? <div className="spinner" /> : null}
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              {status ?? "signing in..."}
            </p>
            {!isLoading ? (
              <button
                type="button"
                onClick={() => setShowAuthOverlay(false)}
                className="mt-4 rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.12)] hover:text-white"
              >
                close
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {/* Header */}
      <header className="space-y-3 animate-fade-in sm:space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
            welcome to bud
          </p>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--muted)] transition hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3 w-3 transition group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            home
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
          let's find music that gets you
        </h1>
        <p className="max-w-xl text-sm text-[var(--muted)] sm:text-base">
          one account. your moods. your playlists. that's it.
        </p>
      </header>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Platform Selection */}
        <section className="glass rounded-2xl p-5 animate-fade-in sm:p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
            where do you listen?
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPlatform("spotify")}
              disabled={isLoading}
              className={`group rounded-xl border px-4 py-4 text-left text-sm text-white transition hover:scale-105 ${
                platform === "spotify"
                  ? "border-[var(--accent)] bg-[rgba(99,91,255,0.2)]"
                  : "border-[var(--border)] bg-[rgba(15,21,36,0.6)] hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.1)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  Spotify
                </p>
                {platform === "spotify" && (
                  <span className="text-[var(--accent)]">✓</span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed sm:text-sm">
                create playlists and open them in spotify.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPlatform("youtube_music")}
              disabled={isLoading}
              className={`group rounded-xl border px-4 py-4 text-left text-sm text-white transition hover:scale-105 ${
                platform === "youtube_music"
                  ? "border-[var(--accent)] bg-[rgba(99,91,255,0.2)]"
                  : "border-[var(--border)] bg-[rgba(15,21,36,0.6)] hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.1)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  YouTube Music
                </p>
                {platform === "youtube_music" && (
                  <span className="text-[var(--accent)]">✓</span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed sm:text-sm">
                build playlists for youtube music.
              </p>
            </button>
          </div>
        </section>

        {/* Sign In */}
        <section className="glass rounded-2xl p-5 animate-slide-in-right sm:p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
            sign in
          </p>
          <div className="mt-4 grid gap-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogle}
              className="group flex items-center justify-center gap-3 rounded-xl bg-[var(--accent)] px-4 py-4 text-sm text-white hover:bg-[var(--accent-2)] hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  working...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.427 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                  </svg>
                  continue with google
                </>
              )}
            </button>
            
            {status && !showAuthOverlay ? (
              <p className="text-center text-xs text-[var(--muted)] animate-fade-in">
                {status}
              </p>
            ) : null}
            
            <div className="rounded-xl border border-[var(--border)] bg-[rgba(15,21,36,0.4)] p-4">
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                we only use google sign-in. no passwords to remember, no email verification. 
                your data is yours and we don't sell it or show ads.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
