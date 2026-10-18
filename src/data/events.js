// Events, Community Days and global bonuses. Dates are relative to "today"
// so the demo always has something active.
const now = new Date()
const dayMs = 86400000

function inRange(d, start, end) { return d >= start && d <= end }

export const EVENTS = [
  {
    id: 'pop-week', name: 'Pop Week', genre: 'Pop',
    start: now.getTime() - 2 * dayMs, end: now.getTime() + 3 * dayMs,
    bonuses: { spawnMult: 2, catchXp: 2, stardust: 1.5 },
    desc: 'Pop tracks flood the map. Double catch XP, 1.5× stardust.',
    color: '#ec4899',
  },
  {
    id: 'electro-night', name: 'Electro Night', genre: 'Electronic',
    start: now.getTime() - 1 * dayMs, end: now.getTime() + 5 * dayMs,
    bonuses: { spawnMult: 2, catchXp: 1.5, lureDuration: 2 },
    desc: 'Electronic spawns boosted. Lures last twice as long.',
    color: '#22d3ee',
  },
  {
    id: 'indie-fest', name: 'Indie Fest', genre: 'Indie',
    start: now.getTime() + 6 * dayMs, end: now.getTime() + 9 * dayMs,
    bonuses: { spawnMult: 2.5, catchXp: 2 },
    desc: 'Indie Fest is coming. Huge indie spawn rates!',
    color: '#84cc16',
  },
]

export const COMMUNITY_DAYS = [
  { id: 'cd-pop', name: 'City Lights Community Day', trackId: 2, start: now.getTime() - 6 * dayMs, end: now.getTime() + 1 * dayMs, spawnMult: 8, shinyMult: 5, moveBonus: 'Encore Blast' },
  { id: 'cd-rock', name: 'Riot Community Day', trackId: 13, start: now.getTime() + 10 * dayMs, end: now.getTime() + 13 * dayMs, spawnMult: 8, shinyMult: 5, moveBonus: 'Wall of Sound' },
]

export function activeEvents(t = Date.now()) {
  return EVENTS.filter(e => inRange(t, e.start, e.end))
}
export function upcomingEvents(t = Date.now()) {
  return EVENTS.filter(e => e.start > t).sort((a, b) => a.start - b.start)
}
export function activeCommunityDay(t = Date.now()) {
  return COMMUNITY_DAYS.find(c => inRange(t, c.start, c.end)) || null
}
export function upcomingCommunityDays(t = Date.now()) {
  return COMMUNITY_DAYS.filter(c => c.end > t).sort((a, b) => a.start - b.start)
}

// spawn weight multiplier for a genre given active events/weather
export function eventGenreMult(genre, t = Date.now()) {
  let m = 1
  for (const e of activeEvents(t)) if (e.genre === genre) m *= (e.bonuses.spawnMult || 1)
  const cd = activeCommunityDay(t)
  if (cd) {
    // community day boosts its featured track's genre implicitly via trackId
  }
  return m
}
export function eventCatchXp(t = Date.now()) {
  let m = 1
  for (const e of activeEvents(t)) m *= (e.bonuses.catchXp || 1)
  return m
}
export function eventStardustMult(t = Date.now()) {
  let m = 1
  for (const e of activeEvents(t)) m *= (e.bonuses.stardust || 1)
  return m
}
export function eventLureDurationMult(t = Date.now()) {
  let m = 1
  for (const e of activeEvents(t)) m *= (e.bonuses.lureDuration || 1)
  return m
}
