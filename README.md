# 🎵 bud - AI Mood Playlist Generator

> Tell bud how you're feeling and get a playlist that actually gets it.

---

## ✨ What's Included in This Revamp

### 🎨 UI/UX Improvements
- ✅ **Smooth animations** throughout (fade-ins, slides, hover effects)
- ✅ **Mobile-first responsive design** (looks great on all devices)
- ✅ **Better landing page** (typing animation, relatable copy, no generic fluff)
- ✅ **Improved dashboard** (clean layout, beautiful loading states)
- ✅ **No unnecessary navigation** (streamlined, focused experience)

### 🔐 Authentication
- ✅ **Google-only auth** (simpler, more secure - removed email/password)
- ✅ **Protected routes** (can't navigate back to auth after login)
- ✅ **Dynamic user icons** (color-coded initials based on email)
- ✅ **Logout functionality** (user menu with sign out)
- ✅ **Proper redirects** (auth state management fixed)

### 📱 PWA Support
- ✅ **Install to home screen** (works on iOS and Android)
- ✅ **Offline support** (service worker configured)
- ✅ **App-like experience** (no browser chrome when installed)
- ✅ **Proper manifest** (icons, theme colors, shortcuts)

### 🎵 Music Platform Integration
- ✅ **Spotify OAuth flow** (users can connect their Spotify account)
- ✅ **YouTube Music OAuth flow** (users can connect YouTube Music)
- ✅ **Create playlists** (opens directly in user's chosen platform)
- ✅ **Platform badges** (shows which platform is connected)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the required values (see SETUP.md for detailed instructions):
- **Firebase config** (authentication & database)
- **Gemini API key** (AI playlist generation) - **REQUIRED**
- **Spotify credentials** (optional)
- **YouTube credentials** (optional)

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📋 What You Need

### Required:
1. **Firebase project** (for auth and database)
2. **Gemini API key** (for AI playlist generation)

### Optional (for full functionality):
3. **Spotify Developer account** (to enable Spotify playlists)
4. **Google Cloud project** (to enable YouTube Music playlists)

See **SETUP.md** for detailed setup instructions for each service.

---

## 🎯 Key Features

### Landing Page
- Clean, animated hero section
- Typing effect demo
- Relatable copy (no marketing fluff)
- One-click sign-in

### Dashboard
- Describe your mood in natural language
- Quick mood tags for common feelings
- AI generates 15-25 songs with explanations
- "Find Similar" feature for each song
- Recent playlists history
- User menu with logout

### Mobile Experience
- Fully responsive design
- Touch-friendly buttons
- Optimized for small screens
- Install as PWA for app-like experience

---

## 🔧 Tech Stack

- **Next.js 16** (React framework)
- **TypeScript** (type safety)
- **Tailwind CSS 4** (styling)
- **Firebase** (auth & database)
- **Gemini 2.5 Flash** (AI)
- **Spotify Web API** (music platform)
- **YouTube Data API** (music platform)
- **next-pwa** (PWA support)

---

## 📱 Testing PWA Locally

1. Build for production:
```bash
npm run build
npm start
```

2. Open Chrome DevTools → Application → Manifest
3. Check for "Add to Home Screen" option

---

## 🚀 Deployment

### Vercel (Easiest)
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

**Remember to update:**
- Spotify redirect URI in Spotify Developer Dashboard
- YouTube redirect URI in Google Cloud Console
- Firebase authorized domains

---

## 💡 Pro Tips

- Start with **Spotify** integration (easier than YouTube Music)
- **Gemini API** is free but rate-limited (15 req/min)
- **Firebase free tier** is generous (50K reads/day)
- Test **PWA installation** in production build (not dev)

---

## 📚 Documentation

- **SETUP.md** - Complete setup guide for all services
- **.env.example** - Environment variable template
- **src/app/** - All pages and API routes

---

## 🐛 Common Issues

**"Missing environment variables"**
→ Make sure you created `.env.local` and filled in all required values

**"Spotify connection failed"**
→ Check redirect URI matches exactly in Spotify Dashboard

**"YouTube connection failed"**  
→ Enable YouTube Data API v3 in Google Cloud Console

**"Can navigate back to auth after login"**
→ Fixed! Routes are now protected with `router.replace()`

---

## 🎨 Design System

### Colors
- **Background**: `#0b0f1a`
- **Accent**: `#635bff` (purple)
- **Muted**: `#94a3b8` (gray)

### Typography
- **Font**: JetBrains Mono (monospace)
- **Sizes**: 12px (xs), 14px (sm), 16px (base)

### Animations
- **Fade in**: 0.5s ease-out
- **Slide in**: 0.5s ease-out
- **Hover scale**: 1.05 transform
- **Pulse glow**: 2s infinite

---

**Made with 💜 for people who feel things through music**
