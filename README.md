# Bud - AI Mood Playlist Generator

Bud turns how you feel into a playlist that gets it. It supports Spotify and YouTube Music, and runs as a PWA.

Production
- App: `https://budmusicai.vercel.app`

## Features
- Mood-to-playlist generation with Gemini 2.5 Flash
- Spotify and YouTube Music OAuth connection
- Create playlists directly in the chosen platform
- PWA install (iOS/Android)
- Rating system (1-5 stars + optional notes)
- Recent playlists history
- Custom UI with glass panels and animated states

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Firebase (Auth + Firestore)
- Gemini 2.5 Flash
- Spotify Web API
- YouTube Data API v3
- next-pwa

## Quick Start

1. Install dependencies
```bash
npm install
```

2. Copy env file
```bash
cp .env.example .env.local
```

3. Run dev
```bash
npm run dev
```

Open `http://localhost:3000`

## Environment Variables
Required:
- `GEMINI_API_KEY`
- Firebase web config (see `.env.example`)

Optional (for platform integrations):
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`
- `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `NEXT_PUBLIC_YOUTUBE_CLIENT_ID`
- `NEXT_PUBLIC_YOUTUBE_REDIRECT_URI`

## OAuth Redirect URLs
Production URLs:
- Spotify: `https://budmusicai.vercel.app/integrations/spotify`
- YouTube: `https://budmusicai.vercel.app/integrations/youtube`

Local dev URLs:
- Spotify: `http://localhost:3000/integrations/spotify`
- YouTube: `http://localhost:3000/integrations/youtube`

## Deployment (Vercel)
1. Push to GitHub
2. Import in Vercel
3. Set env vars (Production)
4. Deploy

If YouTube/Spotify auth fails in production, double-check the redirect URLs in their dashboards.

## PWA
To test PWA locally:
```bash
npm run build
npm start
```
Then use Chrome DevTools -> Application -> Manifest.

## Notes
- Gemini can return rate limits (HTTP 429). Wait and retry.
- Ratings are stored on the playlist document in Firestore as `rating` and `ratingNotes`.
