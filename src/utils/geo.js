import { generatePois, poiKey, offsetLatLng, distanceMeters } from '../data/pois'
import { TRACKS, RARITY } from '../data/tracks'
import { weatherForDate } from '../data/types'
import { activeEvents, activeCommunityDay } from '../data/events'
import { seededRand } from '../data/pois'

export { generatePois, poiKey, offsetLatLng, distanceMeters }

export const DEFAULT_CENTER = { lat: 43.4516, lng: -80.4925 } // Kitchener, ON

// biome: coarse genre affinity from latitude so spawns feel location-based
export function biomeGenres(lat) {
  const band = Math.abs(Math.round(lat) % 10)
  const table = [
    ['Electronic', 'K-Pop'], ['Pop', 'Latin'], ['Rock', 'Electronic'],
    ['Jazz', 'Classical'], ['Hip-Hop', 'R&B'], ['Indie', 'Pop'],
    ['Latin', 'Jazz'], ['R&B', 'Hip-Hop'], ['Classical', 'Indie'], ['K-Pop', 'Rock'],
  ]
  return table[band % table.length]
}

// weighted track pool given weather + events + community day
export function spawnPool({ weather, radar = false } = {}) {
  const wBoost = weather?.boost || []
  const now = Date.now()
  const cd = activeCommunityDay(now)
  const cdTrack = cd ? TRACKS.find(t => t.id === cd.trackId) : null
  const pool = []
  for (const t of TRACKS) {
    let w = t.rarity === 'common' ? 5 : t.rarity === 'uncommon' ? 3 : t.rarity === 'rare' ? 2 : t.rarity === 'epic' ? 1 : 0.4
    if (wBoost.includes(t.genre)) w *= 2.5
    if (radar && (t.rarity === 'rare' || t.rarity === 'epic')) w *= 3
    if (cdTrack && t.id === cdTrack.id) w *= 12
    for (let i = 0; i < Math.round(w * 4); i++) pool.push(t.id)
  }
  return pool
}

export function pickTrackId(pool, weather) {
  const id = pool[Math.floor(Math.random() * pool.length)]
  return id
}

export function randomWeather() { return weatherForDate() }

export function makeSpawn(center, trackId, source = 'wild') {
  const ang = Math.random() * Math.PI * 2
  const r = 40 + Math.random() * 260
  const pos = offsetLatLng(center.lat, center.lng, Math.sin(ang) * r, Math.cos(ang) * r)
  return {
    id: `spawn-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    trackId, lat: pos.lat, lng: pos.lng,
    expires: Date.now() + (15 + Math.random() * 15) * 60 * 1000,
    source, // wild | lure | incense | research | raid | rocket | egg
  }
}

export const RARITY_COLOR = (r) => ({
  common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b',
}[r] || '#fff')
