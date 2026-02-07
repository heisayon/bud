"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [typedText, setTypedText] = useState("");
  const fullText = "i feel like i'm remembering something that hasn't happened yet";
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      {/* Simple Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--panel)] text-xs uppercase tracking-widest transition hover:border-[var(--accent)] animate-pulse-glow">
            b
          </div>
          <span className="text-lg uppercase tracking-[0.2em]">bud</span>
        </div>
        <Link
          href="/auth"
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm text-white hover:bg-[var(--accent-2)] hover:scale-105"
        >
          get started
        </Link>
      </header>

      {/* Hero Section */}
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pt-16">
        {/* Left: Content */}
        <section className="flex flex-col gap-6 animate-fade-in lg:gap-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[rgba(15,21,36,0.6)] px-3 py-1.5 text-xs uppercase tracking-[0.3em] text-[var(--muted)] sm:px-4 sm:py-2">
            ai-powered playlists
          </div>
          
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            you know that feeling you can't quite name?
            <br />
            <span className="text-[var(--muted)]">
              there's a song for that.
            </span>
          </h1>
          
          <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            skip the scrolling. skip the spotify algorithm that thinks you want more of what you already heard.
            just tell bud what's going on in your head—messy thoughts, weird vibes, 3am feelings—and get music that actually understands.
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/auth"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-center text-sm text-white hover:bg-[var(--accent-2)] hover:scale-105"
            >
              find your sound
            </Link>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] sm:text-center">
              free. always.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:mt-8">
            <div className="glass rounded-xl p-4 hover:scale-105 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                no training wheels
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white sm:text-sm">
                playlists that shift as your mood does. sad to hopeful. angry to calm. we follow where you're going.
              </p>
            </div>
            <div className="glass rounded-xl p-4 hover:scale-105 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                the quiet stuff
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white sm:text-sm">
                you'll find songs you've never heard. the ones that feel right, not the ones that went viral.
              </p>
            </div>
          </div>
        </section>

        {/* Right: Demo */}
        <section className="flex flex-col gap-6 animate-slide-in-right">
          <div className="glass rounded-2xl p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
              what it looks like
            </p>
            <div className="terminal mt-4 rounded-xl p-3 text-xs text-[var(--muted)] sm:p-4 sm:text-sm">
              <p className="font-mono">&gt; {typedText}<span className="animate-pulse">|</span></p>
              <div className="mt-4 space-y-1 text-xs sm:text-sm">
                <p className="flex items-center gap-2">
                  <span className="spinner" />
                  understanding...
                </p>
                <p>finding songs that feel like memory and longing</p>
                <p>matching emotional tone, not just genre...</p>
              </div>
              <p className="mt-4 text-white">
                ✓ playlist ready: 18 songs for feeling caught between now and then
              </p>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 sm:p-6">
            <div className="space-y-4 text-xs sm:text-sm text-[var(--muted)]">
              <p className="text-xs uppercase tracking-[0.4em]">how it works</p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs text-white">1</span>
                  <p className="text-white text-xs sm:text-sm">write what you're feeling. really. we're not judging.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs text-white">2</span>
                  <p className="text-white text-xs sm:text-sm">
                    ai curates 15-25 songs. each one explained.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs text-white">3</span>
                  <p className="text-white text-xs sm:text-sm">
                    open in spotify or youtube music. that's it.
                  </p>
                </div>
              </div>
              <p className="pt-3 text-xs border-t border-[var(--border)]">
                made by someone who got tired of skipping songs.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 pb-8 text-center text-xs uppercase tracking-[0.3em] text-[var(--muted)] sm:flex-row sm:justify-between sm:gap-4 sm:px-6 sm:pb-10">
        <span>your data stays yours. no ads. no nonsense.</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="transition hover:text-white">
            privacy
          </Link>
          <Link href="/terms" className="transition hover:text-white">
            terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
