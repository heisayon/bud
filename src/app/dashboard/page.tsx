"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

import { useAuth } from "@/lib/firebase/auth-context";
import { auth, db } from "@/lib/firebase/client";

type Song = {
  title: string;
  artist: string;
  reason: string;
  spotifyId?: string;
  youtubeId?: string;
};

type Playlist = {
  id?: string;
  playlistName: string;
  vibeAnalysis?: string;
  moodInput: string;
  songs: Song[];
  platform: "spotify" | "youtube_music";
  createdAt?: Date;
  rating?: number;
};

const moods = [
  "Happy",
  "Melancholic",
  "Energetic",
  "Calm",
  "Angry",
  "Reflective",
  "Restless",
  "Bittersweet",
];

// Generate user initials and color from email
function getUserDisplay(user: { displayName: string | null; email: string | null }) {
  const name = user.displayName || user.email || "B";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent color from email
  const email = user.email || "bud";
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-purple-600",
    "bg-blue-600",
    "bg-green-600",
    "bg-yellow-600",
    "bg-red-600",
    "bg-pink-600",
    "bg-indigo-600",
  ];
  const colorClass = colors[Math.abs(hash) % colors.length];

  return { initials, colorClass };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [moodInput, setMoodInput] = useState("");
  const [current, setCurrent] = useState<Playlist | null>(null);
  const [history, setHistory] = useState<Playlist[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [ratingNotes, setRatingNotes] = useState("");
  const [lastRatedId, setLastRatedId] = useState<string | null>(null);
  const [showRatingNote, setShowRatingNote] = useState(false);
  const [preferredPlatform, setPreferredPlatform] = useState<"spotify" | "youtube_music">("spotify");
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<
    "spotify" | "youtube" | null
  >(null);

  const userDisplay = user ? getUserDisplay(user) : null;

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const loadUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap?.exists?.()) {
        const data = snap.data() as DocumentData;
        if (data?.preferredPlatform) {
          setPreferredPlatform(data.preferredPlatform);
        }
        setSpotifyConnected(!!data?.integrations?.spotify?.accessToken);
        setYoutubeConnected(!!data?.integrations?.youtube?.refreshToken);
      }
    };

    loadUser().catch(() => null);
  }, [user]);

  useEffect(() => {
    if (!showUserMenu) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (userMenuRef.current?.contains(e.target as Node)) {
        return;
      }
      setShowUserMenu(false);
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("touchend", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("touchend", handleClick);
    };
  }, [showUserMenu]);

  useEffect(() => {
    setShowRatingNote(false);
    setRatingNotes("");
    setLastRatedId(null);
  }, [current?.id]);

  useEffect(() => {
    if (!user) return;

    const loadPlaylists = async () => {
      setHistoryLoading(true);
      try {
        const q = query(
          collection(db, "playlists"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(8)
        );
        const snap = await getDocs(q);
        const items: Playlist[] = snap.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            playlistName: data.playlistName,
            moodInput: data.moodInput,
            songs: data.songs ?? [],
            platform: data.platform ?? "spotify",
            createdAt: data.createdAt?.toDate?.() ?? undefined,
            rating: typeof data.rating === "number" ? data.rating : undefined,
          };
        });
        setHistory(items);
        if (!current && items.length > 0) {
          setCurrent(items[0]);
        }
      } catch (error) {
        console.error("Failed to load playlists with index query:", error);
        const fallbackQuery = query(
          collection(db, "playlists"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(fallbackQuery);
        const items: Playlist[] = snap.docs
          .map((doc) => {
            const data = doc.data() as DocumentData;
            return {
              id: doc.id,
              playlistName: data.playlistName,
              moodInput: data.moodInput,
              songs: data.songs ?? [],
              platform: data.platform ?? "spotify",
              createdAt: data.createdAt?.toDate?.() ?? undefined,
              rating: typeof data.rating === "number" ? data.rating : undefined,
            };
          })
          .sort((a, b) => {
            const aTime = a.createdAt?.getTime?.() ?? 0;
            const bTime = b.createdAt?.getTime?.() ?? 0;
            return bTime - aTime;
          })
          .slice(0, 8);
        setHistory(items);
        if (!current && items.length > 0) {
          setCurrent(items[0]);
        }
      } finally {
        setHistoryLoading(false);
      }
    };

    loadPlaylists().catch(() => null);
  }, [user]);

  const canGenerate = useMemo(
    () => moodInput.trim().length > 0 && !!user && !busy,
    [moodInput, user, busy]
  );

  const generatePlaylist = async (input: string, label?: string) => {
    if (!user) return;
    setBusy(true);
    setStatus(label ?? "listening to what you said...");
    setCurrent(null); // Clear current playlist during generation

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodInput: input,
          rating: current?.rating,
          ratingNotes: ratingNotes.trim() || undefined,
        }),
      });
      const data = await response.json();

      const parsed =
        typeof data?.playlistName === "string"
          ? data
          : typeof data?.raw === "string"
            ? JSON.parse(data.raw)
            : null;

      if (!parsed?.playlistName || !Array.isArray(parsed?.songs)) {
        throw new Error("Invalid response");
      }

      const playlist: Playlist = {
        playlistName: parsed.playlistName,
        moodInput: input,
        songs: parsed.songs,
        platform: preferredPlatform,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "playlists"), {
        userId: user.uid,
        moodInput: playlist.moodInput,
        playlistName: playlist.playlistName,
        songs: playlist.songs,
        platform: playlist.platform,
        createdAt: serverTimestamp(),
        createdAtClient: Date.now(),
      });
      const playlistWithId = { ...playlist, id: docRef.id };

      setCurrent(playlistWithId);
      setHistory((prev) => [playlistWithId, ...prev].slice(0, 8));

      setStatus("playlist ready.");
    } catch (error) {
      setStatus("something went wrong. try again.");
    } finally {
      setBusy(false);
    }
  };

  const ratePlaylist = async (
    playlist: Playlist,
    rating: number,
    notes?: string
  ) => {
    if (!user || !playlist.id) return;
    setHistory((prev) =>
      prev.map((item) =>
        item.id === playlist.id ? { ...item, rating } : item
      )
    );
    if (current?.id === playlist.id) {
      setCurrent({ ...playlist, rating });
    }
    try {
      await updateDoc(doc(db, "playlists", playlist.id), {
        rating,
        ratingNotes: notes ?? null,
        ratedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to rate playlist:", error);
    }
  };

  const handleGenerate = async () => {
    await generatePlaylist(moodInput, "listening to what you said...");
  };

  const handleSimilar = async (song: Song) => {
    const prompt = `Find 10-15 songs similar to "${song.title}" by ${song.artist} with a focus on hidden gems. Explain each pick in one sentence.`;
    await generatePlaylist(prompt, "finding more like this...");
  };

 const connectSpotify = () => {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    setStatus("missing spotify config. contact support.");
    return;
  }
  const state = crypto.randomUUID();
  sessionStorage.setItem("spotify_state", state);
  const scope = [
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-email",
  ].join(" ");
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope,
    state,
  });
  
  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  
  // ✅ OPEN IN POPUP WINDOW
  const popup = window.open(
    authUrl,
    'Spotify Login',
    'width=500,height=700,left=200,top=100'
  );
  
  // ✅ LISTEN FOR POPUP TO CLOSE
  const checkPopup = setInterval(() => {
    if (popup?.closed) {
      clearInterval(checkPopup);
      // Refresh connection status after popup closes
      setTimeout(async () => {
        if (user) {
          const snap = await getDoc(doc(db, "users", user.uid));
          const data = snap.data();
          setSpotifyConnected(!!data?.integrations?.spotify?.accessToken);
        }
      }, 1000);
    }
  }, 500);
};

const connectYouTube = () => {
  const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    setStatus("missing youtube config. contact support.");
    return;
  }
  const state = crypto.randomUUID();
  sessionStorage.setItem("youtube_state", state);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl",
    state,
    access_type: "offline",
    prompt: "consent",
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  // ✅ OPEN IN POPUP WINDOW
  const popup = window.open(
    authUrl,
    'YouTube Login',
    'width=500,height=700,left=200,top=100'
  );
  
  // ✅ LISTEN FOR POPUP TO CLOSE
  const checkPopup = setInterval(() => {
    if (popup?.closed) {
      clearInterval(checkPopup);
      // Refresh connection status after popup closes
      setTimeout(async () => {
        if (user) {
          const snap = await getDoc(doc(db, "users", user.uid));
          const data = snap.data();
          setYoutubeConnected(!!data?.integrations?.youtube?.refreshToken);
        }
      }, 1000);
    }
  }, 500);
};

  const createPlatformPlaylist = async () => {
  if (!user || !current) return;
  setBusy(true);
  setStatus("creating playlist...");
  
  try {
    const token = await user.getIdToken();
    const endpoint =
      preferredPlatform === "spotify"
        ? "/api/spotify/create-playlist"
        : "/api/youtube/create-playlist";
    
    console.log('🎵 Creating playlist on:', preferredPlatform);
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        playlistName: current.playlistName,
        songs: current.songs,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Failed:', data);
      // ✅ Show the actual error in your existing status UI
      setStatus(data.error || "couldn't create playlist.");
      return;
    }
    
    console.log('✅ Success:', data);
    
    if (data?.url) {
      // ✅ Show success with song count in your existing status UI
      const added = data.songsAdded || current.songs.length;
      const skipped = data.songsSkipped || 0;
      
      setStatus(
        skipped > 0 
          ? `playlist created! ${added} songs added, ${skipped} skipped.`
          : `playlist created! ${added} songs added.`
      );
      
      window.open(data.url, "_blank", "noopener,noreferrer");
    } else {
      setStatus("created, but no link returned.");
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
    setStatus("connection failed. check internet.");
  } finally {
    setBusy(false);
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    router.replace("/auth");
  } catch (error) {
    console.error("logout failed:", error);
  }
};

  const updatePlatform = async (platform: "spotify" | "youtube_music") => {
    if (!user) return;
    setPreferredPlatform(platform);
    await setDoc(
      doc(db, "users", user.uid),
      { preferredPlatform: platform, updatedAt: serverTimestamp() },
      { merge: true }
    );
    setShowUserMenu(false);
  };

  const disconnectSpotify = async () => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      {
        integrations: {
          spotify: {
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            userId: null,
          },
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setSpotifyConnected(false);
    setShowUserMenu(false);
  };

  const disconnectYouTube = async () => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      {
        integrations: {
          youtube: {
            accessToken: null,
            refreshToken: null,
            expiryDate: null,
            channelId: null,
          },
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setYoutubeConnected(false);
    setShowUserMenu(false);
  };

  const confirmDisconnect = (target: "spotify" | "youtube") => {
    setDisconnectTarget(target);
    setShowUserMenu(false);
  };

  const handleConfirmDisconnect = async () => {
    if (disconnectTarget === "spotify") {
      await disconnectSpotify();
    }
    if (disconnectTarget === "youtube") {
      await disconnectYouTube();
    }
    setDisconnectTarget(null);
  };

  // Show loading screen
  if (loading || !user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 sm:px-6">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-12">
      <div className="flex items-center justify-between">
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
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
              dashboard
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
            how are you feeling?
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Platform Badge */}
          <div className="hidden sm:block rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {preferredPlatform === "spotify" ? "spotify" : "youtube"}
          </div>

          {/* Connect Button */}
          {preferredPlatform === "spotify" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={spotifyConnected ? undefined : connectSpotify}
                disabled={spotifyConnected}
                className={`rounded-full border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)] transition sm:px-4 ${spotifyConnected
                  ? "cursor-default opacity-70"
                  : "hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.12)] hover:text-white"
                  }`}
              >
                {spotifyConnected ? "connected" : "connect"}
              </button>

            </div>
          ) : (
            <button
              type="button"
              onClick={youtubeConnected ? undefined : connectYouTube}
              disabled={youtubeConnected}
              className={`rounded-full border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)] transition sm:px-4 ${youtubeConnected
                ? "cursor-default opacity-70"
                : "hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.12)] hover:text-white"
                }`}
            >
              {youtubeConnected ? "connected" : "connect"}
            </button>
          )}

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white transition hover:scale-110 ${userDisplay?.colorClass || "bg-purple-600"}`}
            >
              {userDisplay?.initials || "B"}
            </button>

            {showUserMenu && (
              <div className="absolute left-0 top-12 z-50 w-48 animate-fade-in rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2 shadow-lg sm:left-auto sm:right-0">
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs text-[var(--muted)]">
                    {user.email}
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePlatform("spotify")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-[rgba(99,91,255,0.12)]"
                  >
                    switch to spotify
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePlatform("youtube_music")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-[rgba(99,91,255,0.12)]"
                  >
                    switch to youtube
                  </button>
                  {spotifyConnected ? (
                    <button
                      type="button"
                      onClick={() => confirmDisconnect("spotify")}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-[rgba(99,91,255,0.12)]"
                    >
                      disconnect spotify
                    </button>
                  ) : null}
                  {youtubeConnected ? (
                    <button
                      type="button"
                      onClick={() => confirmDisconnect("youtube")}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-[rgba(99,91,255,0.12)]"
                    >
                      disconnect youtube
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-[rgba(99,91,255,0.12)]"
                  >
                    sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
        {/* Left: Input */}
        <section className="glass rounded-2xl p-5 animate-fade-in sm:p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
            mood input
          </p>
          <textarea
            rows={4}
            placeholder="how are you feeling right now? (be honest, be specific, be messy)"
            value={moodInput}
            onChange={(event) => setMoodInput(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 sm:rows-5"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {moods.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => setMoodInput(mood.toLowerCase())}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)] transition hover:scale-105 hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.15)] hover:text-white sm:px-4 sm:py-2"
              >
                {mood}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              {status ?? "ready when you are"}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm text-white transition hover:bg-[var(--accent-2)] hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:px-6"
            >
              {busy ? (
                <>
                  <span className="spinner" />
                  working...
                </>
              ) : (
                "make me a playlist"
              )}
            </button>
          </div>
        </section>

        {/* Right: Output */}
        <section className="glass rounded-2xl p-5 animate-slide-in-right sm:p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
            output
          </p>

          {/* Loading State */}
          {busy && !current && (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 py-12 animate-fade-in">
              <div className="spinner" />
              <div className="space-y-2 text-center">
                <p className="text-sm text-white">generating your playlist...</p>
                <p className="text-xs text-[var(--muted)]">this usually takes a few seconds</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!current && !busy && (
            <div className="mt-8 space-y-3 py-12 text-center animate-fade-in">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)]">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <p className="text-sm text-[var(--muted)]">
                your playlist will appear here.
                <br />
                just tell me how you're feeling first.
              </p>
            </div>
          )}

          {/* Playlist Display */}
          {current && (
            <div className="mt-4 space-y-4 animate-fade-in">
              <div className="rounded-xl border border-[var(--border)] bg-[rgba(15,21,36,0.5)] p-4">
  <p className="text-sm font-semibold text-white">
    {current.playlistName}
  </p>
  {current.vibeAnalysis && (
    <p className="mt-2 text-xs leading-relaxed text-[var(--muted)] italic">
      "{current.vibeAnalysis}"
    </p>
  )}
  <p className="mt-2 text-xs text-[var(--muted)]">
    {current.moodInput}
  </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {current.songs.length} songs
                </p>
              </div>

              <button
                type="button"
                onClick={createPlatformPlaylist}
                disabled={
                  busy ||
                  (preferredPlatform === "spotify"
                    ? !spotifyConnected
                    : !youtubeConnected)
                }
                className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm text-white transition hover:bg-[var(--accent-2)] hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {preferredPlatform === "spotify"
                  ? spotifyConnected
                    ? "open in spotify"
                    : "connect spotify first"
                  : youtubeConnected
                    ? "open in youtube music"
                    : "connect youtube first"}
              </button>

              {/* Rating - Compact and Less Intrusive */}
{current.id && (
  <div className="mt-4 rounded-xl border border-[var(--border)] bg-[rgba(15,21,36,0.3)] p-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
        {current.rating ? `rated ${current.rating}/5` : "rate this"}
      </p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              ratePlaylist(current, star);
              setLastRatedId(current.id || null);
            }}
            className="group transition hover:scale-110"
          >
            <svg
              className={`h-5 w-5 transition ${
                (current.rating || 0) >= star
                  ? "fill-[var(--accent)] text-[var(--accent)]"
                  : "fill-none text-[var(--muted)] group-hover:fill-[var(--accent)] group-hover:text-[var(--accent)]"
              }`}
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
    {/* Optional: Show note input only after rating */}
    {current.rating && current.rating <= 3 && lastRatedId === current.id && (
      <div className="mt-3 animate-fade-in">
        <input
          type="text"
          placeholder="what didn't work? (optional)"
          value={ratingNotes}
          onChange={(e) => setRatingNotes(e.target.value)}
          onBlur={() => {
            if (ratingNotes.trim() && current.id) {
              ratePlaylist(current, current.rating!, ratingNotes);
            }
          }}
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-xs text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>
    )}
  </div>
)}

              {/* Songs List - Scrollable on mobile */}
              <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2 lg:max-h-[500px] playlist-scroll">
                {current.songs.map((song, index) => (
                  <div
                    key={`${song.title}-${index}`}
                    className="rounded-xl border border-[var(--border)] bg-[rgba(15,21,36,0.4)] p-3 transition hover:border-[var(--accent)] hover:bg-[rgba(15,21,36,0.6)] sm:p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-white">{song.title}</p>
                        <p className="truncate text-xs text-[var(--muted)]">
                          {song.artist}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                          {song.reason}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSimilar(song)}
                        disabled={busy}
                        className="flex-shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--muted)] transition hover:scale-105 hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.15)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2"
                      >
                        similar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Recent Playlists */}
      <section className="glass rounded-2xl p-5 animate-fade-in sm:p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
          recent playlists
        </p>
        {historyLoading ? (
          <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            <span className="spinner h-4 w-4" />
            loading history...
          </div>
        ) : history.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            no saved playlists yet. make your first one above.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {history.map((playlist, idx) => (
              <button
                key={playlist.id ?? `${playlist.playlistName}-${idx}`}
                type="button"
                onClick={() => setCurrent(playlist)}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="animate-fade-in rounded-xl border border-[var(--border)] bg-[rgba(15,21,36,0.6)] p-4 text-left transition hover:scale-105 hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.12)]"
              >
                <p className="truncate text-sm font-semibold text-white">
                  {playlist.playlistName}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                  {playlist.moodInput}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {playlist.songs?.length ?? 0} songs
                </p>
                {playlist.rating ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    rated {playlist.rating}/5
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </section>
      {disconnectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,12,24,0.75)] px-4"
          onClick={() => setDisconnectTarget(null)}
        >
          <div
            className="glass w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              confirm
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              disconnect {disconnectTarget}?
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              you can reconnect anytime, but we will stop creating playlists
              for this account until you do.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDisconnectTarget(null)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.12)] hover:text-white"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-[var(--accent-2)]"
              >
                disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
