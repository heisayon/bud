"use client";

import { useEffect, useMemo, useState } from "react";
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
  moodInput: string;
  songs: Song[];
  platform: "spotify" | "youtube_music";
  createdAt?: Date;
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
  const [preferredPlatform, setPreferredPlatform] = useState<"spotify" | "youtube_music">("spotify");
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    if (!user) return;

    const loadPlaylists = async () => {
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
        body: JSON.stringify({ moodInput: input }),
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

      setCurrent(playlist);
      setHistory((prev) => [playlist, ...prev].slice(0, 8));

      await addDoc(collection(db, "playlists"), {
        userId: user.uid,
        moodInput: playlist.moodInput,
        playlistName: playlist.playlistName,
        songs: playlist.songs,
        platform: playlist.platform,
        createdAt: serverTimestamp(),
        createdAtClient: Date.now(),
      });

      setStatus("playlist ready.");
    } catch (error) {
      setStatus("something went wrong. try again.");
    } finally {
      setBusy(false);
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
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
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
      access_type: "offline",
      prompt: "consent",
      scope: "https://www.googleapis.com/auth/youtube",
      state,
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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
        setStatus("couldn't create playlist.");
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        setStatus("playlist created!");
      } else {
        setStatus("created, but no link returned.");
      }
    } catch (error) {
      setStatus("couldn't create playlist.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
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
    if (!confirm("disconnect spotify account?")) return;
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
    if (!confirm("disconnect youtube account?")) return;
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

  // Show loading screen
  if (loading || !user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 sm:px-6">
        <div className="spinner" />
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
          loading...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-12">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
            dashboard
          </p>
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
                onClick={connectSpotify}
                className="rounded-full border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.12)] hover:text-white sm:px-4"
              >
                {spotifyConnected ? "✓ connected" : "connect"}
              </button>
      
            </div>
          ) : (
            <button
              type="button"
              onClick={connectYouTube}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[rgba(99,91,255,0.12)] hover:text-white sm:px-4"
            >
              {youtubeConnected ? "✓ connected" : "connect"}
            </button>
          )}
          
          {/* User Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white transition hover:scale-110 ${userDisplay?.colorClass || "bg-purple-600"}`}
            >
              {userDisplay?.initials || "B"}
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 top-12 z-50 w-48 animate-fade-in rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2 shadow-lg">
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
                      onClick={disconnectSpotify}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-[rgba(99,91,255,0.12)]"
                    >
                      disconnect spotify
                    </button>
                  ) : null}
                  {youtubeConnected ? (
                    <button
                      type="button"
                      onClick={disconnectYouTube}
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
              <div className="text-4xl opacity-30">♫</div>
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
                <p className="mt-1 text-xs text-[var(--muted)]">
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
              
              {/* Songs List - Scrollable on mobile */}
              <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2 lg:max-h-[500px]">
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
        {history.length === 0 ? (
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
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
