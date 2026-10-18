# MusicGo 🎵

**Pokémon GO, but for music.** Walk the real world, discover wild tracks on a live map, flick-throw discs to catch them, build your collection, defend venue gyms, raid bosses, rescue Shadow tracks from Team Static, and climb the Battle League.

MusicGo is a mobile-first web app (PWA) packaged as a native Android app via Capacitor. All progress persists locally (localStorage).

## Features

### Map & exploration
- GPS avatar (watchPosition) with a demo-area fallback, real distance tracking
- Wild spawns influenced by weather, biome (latitude), events, Community Day, lures, incense and radar
- Nearby tracker sorted by distance, with spawn sources (wild / lure / incense / raid / rocket…)
- Amplifier Stops (PokéStops) and Venue Gyms generated at stable real-world grid locations
- Daily catch & PokéStop streaks, Field Research from stop spins
- Routes with waypoints, route rewards and Crescendo Cells (summon the Maestro track)

### Catching
- Flick throws with a shrinking target ring — Nice / Great / Excellent, curveballs (sideways flick), critical catches
- Track attacks & dodges that deflect throws; fleeing tracks; catch difficulty readout
- Disc tiers (Catch / Gold / Platinum / Master), berries (Razz, Nanab calm, Pinap candy, Golden Razz)
- Weather-boosted encounters, AR / AR+ mode (device camera when available)
- Catches from research, raids, Team Static rescues, eggs, trades and snapshot photobombs

### Listening
- Caught songs actually play: each track is resolved to its **YouTube** video (search via public Piped API instances — no API key — with results cached) and streamed through the official YouTube IFrame player, with an expandable in-app video, a "Watch on YouTube ↗" link, and real song length/seek. Famous works (Beethoven, Mozart) have hand-tuned search queries.
- If YouTube is unreachable or a track has no match, playback automatically falls back to the built-in **synth engine**, which performs a unique deterministic arrangement per track (key, tempo, chords, melody, bass, drums) with Web Audio — works fully offline. Switch sources anytime in the player (YouTube ⇄ Synth); your choice is remembered.
- ▶ buttons on collection cards and Pokédex entries, a full detail "Listen" panel, "Listen now" right after a catch, and "Listen together" with your Buddy
- Persistent mini-player above the nav bar: play/pause, next/previous, seek, volume, shuffle, repeat (off/all/one), queue position, OS media controls (Media Session), play counts + "Most played" sorting

### Collection & growth
- Instance-based box + Pokédex registration (seen/caught/shiny/shadow/mega/costume)
- IV appraisal with stat bars, CP/HP, fast & charged move lists
- Power Up (Stardust + Candy), Evolution, Mega Evolution (energy), Shadow purification
- Transfer for candy, favorites, tags, forms & costumes, search/sort/filter
- Buddy system: hearts, buddy levels, walking for species candy (+ Mega Energy)

### Items, eggs, gyms, battles, research & social
- Stop/Gym disc spins with loot tables, lures, gifts, postcards (regional collection), storage limits and a shop
- 2/5/7/10/12 km eggs, incubators (incl. Turbo), Adventure Sync, weekly fitness rewards
- Teams (Instinct/Mystic/Valor), gym defenders, berry feeding/motivation, defender coins, gym badges
- Battle engine: fast/charged attacks, energy, charged-move tap mini-game, Protect Shields, type effectiveness, persistent HP, potions/revives
- Gym battles, Raid Battles (standard / Shadow / Max), GO Battle League with CP caps, Trainer Battles, Team Static grunts/leaders/boss
- Field / Special / Timed / Seasonal research, daily challenges, events & Community Days
- Friends & friendship levels, gifts, trading (incl. special trades & lucky trades), Party Play challenges

## Run (web / preview)

```bash
npm install
npm run dev
```

Open http://localhost:5173 on your phone or browser. GPS works on HTTPS/localhost; otherwise the app falls back to a demo area around Kitchener, ON. Use the 👣 button on the map to simulate walking (eggs, buddy candy, routes).

## Build Android APK

Requires Android Studio + Android SDK + JDK 17.

```bash
npm run build:android   # builds web + syncs to Android project
npm run cap:open        # opens in Android Studio
```

Then in Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)** — or CLI: `cd android && ./gradlew assembleDebug`.

The Android manifest requests fine/background location (GPS avatar + Adventure Sync), camera (AR encounters & snapshots) and activity recognition (walking distance).

## Tech stack

React 19 · Vite 8 · Tailwind CSS 4 · React Router 7 · Leaflet · Lucide icons · Capacitor 8 · custom persisted store (localStorage, save format v3)

## Project structure

```
src/
  components/   TopBar, BottomNav, TrackArt
  screens/      Map, Encounter, Stop, Gym, Collection, Battle, Profile,
                Inventory, Eggs, Buddy, Research, Raids, Friends, Routes, Events
  data/         tracks (Pokédex), moves, items, types/weather/teams, pois,
                research, routes, events, npcs, evolutions
  store/        persisted game store (all game logic/actions)
  utils/        geo/spawn generation, CP/IV/catch math
android/        Capacitor Android project
```

## License

MIT
