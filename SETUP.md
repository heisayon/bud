# bud - AI Mood Playlist Generator

> Tell bud how you're feeling and get a playlist that actually gets it.

Built with Next.js, Firebase, Gemini AI, and music platform APIs.

---

## 🚀 What's New in This Revamp

### ✨ UI/UX Improvements
- **Animated Landing Page**: Typing effect, fade-in animations, better copy
- **No Unnecessary Nav**: Clean, minimal navigation
- **Better Dashboard**: Mobile-first responsive design, smooth animations
- **Loading States**: Beautiful loading spinners and progress indicators
- **Hover Effects**: Scale transforms, glow effects, smooth transitions

### 🔐 Auth Improvements
- **Google-Only Auth**: Removed email/password (simpler, more secure)
- **Protected Routes**: Can't go back to auth/landing after login
- **Dynamic User Icons**: Color-coded initials based on email
- **Logout Feature**: User menu with sign out option

### 📱 PWA Ready
- Proper `manifest.json` configuration
- Install-to-home-screen ready
- Offline support via next-pwa
- Theme colors and icons configured

---

## 📋 Prerequisites

Before you begin, you need:

1. **Node.js 18+** installed
2. **Firebase Project** (for auth + database)
3. **Gemini API Key** (for AI playlist generation)
4. **Spotify Developer Account** (optional, for Spotify integration)
5. **Google Cloud Project** (optional, for YouTube Music integration)

---

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd Bud-Revamped
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in methods → **Google**
4. Enable **Firestore Database** → Create database (start in production mode)
5. Go to Project Settings → General → Your apps → Add web app
6. Copy your Firebase config

Create `.env.local` in the project root:

```env
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key"
```

**For Firebase Admin credentials:**
- Firebase Console → Project Settings → Service Accounts
- Click "Generate new private key"
- Download the JSON file
- Copy the values to your `.env.local`

---

### 3. Gemini AI Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Add to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key
```

---

### 4. Spotify Integration (Optional)

#### A. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create app"
3. Fill in:
   - **App name**: bud
   - **App description**: AI mood playlist generator
   - **Redirect URI**: `http://localhost:3000/integrations/spotify` (for dev)
   - **Redirect URI**: `https://yourdomain.com/integrations/spotify` (for production)
   - **APIs**: Web API
4. Save your **Client ID** and **Client Secret**

#### B. Add to Environment Variables

```env
# Spotify
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/integrations/spotify
```

#### C. How Users Connect Spotify

1. User clicks "Connect Spotify" in dashboard
2. They authorize bud to create playlists
3. Access token is stored in Firestore
4. User can now create playlists directly in Spotify

---

### 5. YouTube Music Integration (Optional)

#### A. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **YouTube Data API v3**:
   - APIs & Services → Library → Search "YouTube Data API v3" → Enable

#### B. Create OAuth Credentials

1. APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: bud
   - User support email: your email
   - Scopes: Add `https://www.googleapis.com/auth/youtube`
3. Create OAuth client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/integrations/youtube`
   - Also add: `https://yourdomain.com/integrations/youtube` (for production)
4. Save your **Client ID** and **Client Secret**

#### C. Add to Environment Variables

```env
# YouTube Music
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
NEXT_PUBLIC_YOUTUBE_REDIRECT_URI=http://localhost:3000/integrations/youtube
```

#### D. How Users Connect YouTube Music

1. User clicks "Connect YouTube" in dashboard
2. They authorize bud to manage YouTube playlists
3. Refresh token is stored in Firestore
4. User can now create playlists in YouTube Music

---

## 🏃 Running the App

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
Bud-Revamped/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── gemini/       # Gemini AI playlist generation
│   │   │   ├── spotify/      # Spotify OAuth & playlist creation
│   │   │   └── youtube/      # YouTube OAuth & playlist creation
│   │   ├── auth/             # Authentication page
│   │   ├── dashboard/        # Main dashboard
│   │   ├── integrations/     # OAuth callback handlers
│   │   ├── globals.css       # Global styles + animations
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   └── providers.tsx     # Auth provider wrapper
│   └── lib/
│       └── firebase/         # Firebase config and utilities
├── public/
│   └── manifest.json         # PWA manifest
└── .env.local                # Environment variables (create this)
```

---

## 🔑 Environment Variables Reference

Create `.env.local` with these values:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Gemini AI (Required)
GEMINI_API_KEY=

# Spotify (Optional)
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=

# YouTube Music (Optional)
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
NEXT_PUBLIC_YOUTUBE_REDIRECT_URI=
```

---

## 🎨 Features

### Landing Page
- Animated typing effect
- Fade-in animations
- Clean, relatable copy
- Mobile-first responsive

### Auth Page
- Google-only authentication
- Platform selection (Spotify or YouTube Music)
- Auto-redirect if already logged in
- Loading states

### Dashboard
- Mood input with quick tags
- AI playlist generation
- Beautiful loading animations
- Song-by-song explanations
- "Find Similar" feature
- Recent playlists history
- User menu with logout
- Dynamic user icons
- Fully responsive (mobile-first)

### PWA
- Install to home screen
- Offline support
- Custom icons and theme

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

**Important for Production:**
- Update Spotify redirect URI to your domain
- Update YouTube redirect URI to your domain
- Update Firebase authorized domains

---

## 📱 PWA Installation

Users can install bud as a PWA:

**Desktop:**
- Chrome/Edge: Click install icon in address bar
- Safari: File → Add to Dock

**Mobile:**
- Chrome: Menu → Add to Home Screen
- Safari: Share → Add to Home Screen

---

## 🐛 Troubleshooting

### Spotify Connection Not Working
- Check redirect URI matches exactly (trailing slashes matter!)
- Verify Client ID and Secret are correct
- Check Firestore security rules allow writes to `users/{userId}`

### YouTube Connection Not Working
- Ensure YouTube Data API v3 is enabled in Google Cloud
- Verify OAuth consent screen is configured
- Check redirect URI matches exactly

### Gemini API Errors
- Verify API key is valid
- Check quota limits (free tier: 15 req/min, 1500 req/day)
- Ensure GEMINI_API_KEY is in `.env.local`

### Firebase Auth Errors
- Check Firebase config values are correct
- Verify Google sign-in is enabled in Firebase console
- Ensure authorized domains include your deployment domain

---

## 💡 Tips

- **Test locally first** before deploying
- **Use Spotify first** (easier than YouTube Music)
- **Gemini API** is free but rate-limited
- **Firebase free tier** is generous (50K reads/day, 20K writes/day)

---

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Google Gemini AI](https://ai.google.dev/)
- [Spotify Web API](https://developer.spotify.com/)
- [YouTube Data API](https://developers.google.com/youtube)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Questions?** Open an issue or reach out!
