// Deterministic generation of PokéStop ("Amplifier") and Gym ("Venue") POIs
// around a center point, seeded by grid cell so the world is stable.
export const STOP_NAMES = [
  'Vinyl Vault', 'Riff Records', 'Beat Street', 'Groove Box', 'Amp Hall',
  'Note Stop', 'Synth Corner', 'Melody Mart', 'Tempo Tap', 'Studio 54',
  'Crescendo Café', 'Bassline Bar', 'Echo Lounge', 'Hi-Fi Shop', 'Turntable Tavern',
  'Frequenzy', 'The Podium', 'Hook & Verse', 'Downbeat Diner', 'Cymbal Shop',
  'Reel-to-Reel', 'Acoustic Corner', 'Lo-Fi Loft', 'The Samplery', 'Mixtape Market',
]
export const GYM_NAMES = [
  'The Grand Stage', 'Underground Club', 'Jazz Lounge', 'Record Store Arena',
  'Concert Hall', 'Open Mic Park', 'Festival Grounds', 'The Backbeat',
  'Harmony Square', 'Encore Theater', 'The Crescendo', 'Bass Arena',
]
export const REGIONS = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea']

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
export function seededRand(seed) {
  let s = seed >>> 0
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function offsetLatLng(lat, lng, mNorth, mEast) {
  const dLat = mNorth / 111111
  const dLng = mEast / (111111 * Math.cos((lat * Math.PI) / 180))
  return { lat: lat + dLat, lng: lng + dLng }
}

// POI key: 0.005° cell (~550m) keeps the world stable while moving.
export function poiKey(lat, lng) { return `${lat.toFixed(3)}:${lng.toFixed(3)}` }

// Generate the POIs for the 3x3 cell neighborhood around a point.
export function generatePois(center) {
  const out = []
  const cellDeg = 0.005
  const cx = Math.floor(center.lat / cellDeg)
  const cy = Math.floor(center.lng / cellDeg)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cellX = cx + dx, cellY = cy + dy
      const key = `${cellX}:${cellY}`
      const rng = seededRand(hash(key))
      // 1 gym + 2 stops per cell
      const gymPos = offsetLatLng(cellX * cellDeg + cellDeg / 2, cellY * cellDeg + cellDeg / 2, (rng() - 0.5) * 400, (rng() - 0.5) * 400)
      const gym = {
        id: `gym-${key}`, kind: 'gym',
        name: GYM_NAMES[Math.floor(rng() * GYM_NAMES.length)],
        lat: gymPos.lat, lng: gymPos.lng,
        gym: { team: null, owner: null, level: 1, points: 0, defenders: [] },
        badge: { visits: 0, spins: 0, battles: 0 },
        lastSpin: 0,
      }
      out.push(gym)
      for (let i = 0; i < 2; i++) {
        const pos = offsetLatLng(cellX * cellDeg + rng() * cellDeg, cellY * cellDeg + rng() * cellDeg, 0, 0)
        out.push({
          id: `stop-${key}-${i}`, kind: 'stop',
          name: STOP_NAMES[Math.floor(rng() * STOP_NAMES.length)],
          lat: pos.lat, lng: pos.lng,
          lure: null, grunt: rng() < 0.06, postcardRegion: REGIONS[Math.floor(rng() * REGIONS.length)],
          badge: { visits: 0, spins: 0 }, lastSpin: 0,
        })
      }
    }
  }
  return out
}

export function distanceMeters(a, b) {
  const R = 6371000
  const toRad = (x) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng)
  const la1 = toRad(a.lat), la2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
