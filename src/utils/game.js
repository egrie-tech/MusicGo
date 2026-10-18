// Core game math: CP/HP, IVs & appraisal, catch rates, difficulty, dates.
import { RARITY, TRACK_BY_ID } from '../data/tracks'

export const CP_PER_LEVEL = 0.55
export const HP_PER_LEVEL = 1.15

export function computeCp(track, level = 1, ivs = { a: 10, d: 10, s: 10 }) {
  const base = track.atk * 0.6 + track.def * 0.3 + track.sta * 0.2
  const lvl = Math.pow(level, 0.85)
  const ivMult = 1 + ((ivs.a + ivs.d + ivs.s) / 300)
  return Math.max(10, Math.round(base * CP_PER_LEVEL * lvl * ivMult * (RARITY[track.rarity]?.cpMult || 1)))
}
export function computeHp(track, level = 1, ivs = { s: 10 }) {
  return Math.max(20, Math.round((track.sta + 40) * HP_PER_LEVEL * (1 + level * 0.08) * (1 + ivs.s / 300)))
}
export function rollIvs() {
  return { a: 1 + Math.floor(Math.random() * 15), d: 1 + Math.floor(Math.random() * 15), s: 1 + Math.floor(Math.random() * 15) }
}
export function ivPercent(ivs) { return (ivs.a + ivs.d + ivs.s) / 45 }

export function appraisal(ivs) {
  const pct = ivPercent(ivs)
  const best = ivs.a >= 13 || ivs.d >= 13 || ivs.s >= 13
  if (pct >= 0.93) return { stars: 3, label: 'Your track is a platinum record!', detail: `Overall ${Math.round(pct * 100)}% — top tier.`, pct, best }
  if (pct >= 0.8) return { stars: 2, label: 'Your track is really strong!', detail: `Overall ${Math.round(pct * 100)}%.`, pct }
  if (pct >= 0.6) return { stars: 1, label: 'Your track has decent potential.', detail: `Overall ${Math.round(pct * 100)}%.`, pct }
  return { stars: 0, label: 'Your track needs more studio time.', detail: `Overall ${Math.round(pct * 100)}%.`, pct }
}

// catch difficulty label from effective success rate
export function catchDifficulty(rate) {
  if (rate >= 0.7) return { label: 'Very Easy', color: '#22c55e', rings: 1 }
  if (rate >= 0.45) return { label: 'Easy', color: '#84cc16', rings: 2 }
  if (rate >= 0.25) return { label: 'Moderate', color: '#eab308', rings: 3 }
  if (rate >= 0.12) return { label: 'Hard', color: '#f97316', rings: 4 }
  return { label: 'Expert', color: '#ef4444', rings: 5 }
}

export function catchSuccessRate({ track, ballMult = 1, berryMult = 1, curveball = false, qualityMult = 1, weatherBoost = false, nanab = false }) {
  const base = track.stats.catchRate
  let r = base * ballMult * berryMult * qualityMult * (curveball ? 1.25 : 1) * (weatherBoost ? 1.2 : 1)
  return Math.min(0.97, Math.max(0.02, r))
}

// date helpers
export function dayId(d = new Date()) { return d.toISOString().slice(0, 10) }
export function weekId(d = new Date()) {
  const date = new Date(d.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return `${date.getFullYear()}-W${1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)}`
}

export function fmtKm(m) { return (m / 1000).toFixed(2) }
export function fmtTimeLeft(ms) {
  if (ms <= 0) return '0m'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}
export function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }

export function trackOf(entry) {
  // entry may be a track id number or a collection entry
  const id = typeof entry === 'number' ? entry : entry?.trackId
  return TRACK_BY_ID[id] || null
}
