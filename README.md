# MusicGo 🎵

**Pokemon Go, but for music.** Walk the real world, discover music drops on a map, catch tracks, build your collection, battle other players at venues, and climb the leaderboards.

MusicGo is a mobile-first web app (PWA) packaged as a native Android app via Capacitor.

## Features

- 🗺️ **Live map** with real GPS location and nearby music drops
- 🎯 **Catch mechanic** with timing mini-game and item discs (ball / gold / platinum)
- 📀 **Collection (Dex)** with rarity tiers: Common → Legendary
- ⚔️ **Turn-based battles** using your caught tracks as a team
- 🏟️ **Venues** to claim and defend
- 🎒 **Inventory & Shop** with lures, incense, potions, radar
- 👤 **Profile** with levels, XP, badges, avatars
- 💾 Offline-friendly persistence (localStorage)

## Run (web / preview)

```bash
npm install
npm run dev
```

Open http://localhost:5173 on your phone or browser.

## Build Android APK

Requires Android Studio + Android SDK + JDK 17.

```bash
npm run build:android   # builds web + syncs to Android project
npm run cap:open        # opens in Android Studio
```

Then in Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)**.

Or from CLI:
```bash
cd android && ./gradlew assembleDebug
# APK at android/app/build/outputs/apk/debug/app-debug.apk
```

## Tech stack

React 19 · Vite 8 · Tailwind CSS 4 · React Router 7 · Leaflet · Framer Motion · Zustand · Capacitor 8

## Project structure

```
src/
  components/   TopBar, BottomNav
  screens/      Map, Encounter, Collection, Battle, Profile, Inventory, Venue
  data/         tracks, items, venues
  store/        Zustand store (persisted)
  utils/        geo helpers
android/        Capacitor Android project
```

## License

MIT
