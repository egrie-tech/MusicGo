// Genre "types" (the type chart), weather, teams, leagues.
export const TYPES = ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Indie', 'R&B', 'Latin', 'K-Pop']

export const TYPE_COLORS = {
  Pop: '#ec4899', 'Hip-Hop': '#f59e0b', Rock: '#ef4444', Electronic: '#22d3ee',
  Jazz: '#a78bfa', Classical: '#e2e8f0', Indie: '#84cc16', 'R&B': '#8b5cf6',
  Latin: '#fb923c', 'K-Pop': '#f472b6',
}

// attack genre -> { defenderGenre: multiplier }
const chart = {
  Pop:        { Rock: 2, Indie: 0.5, 'Hip-Hop': 1 },
  'Hip-Hop':  { Pop: 2, Classical: 0.5, Rock: 1 },
  Rock:       { Electronic: 2, Pop: 0.5, Jazz: 1 },
  Electronic: { Rock: 2, Classical: 0.5, Pop: 1 },
  Jazz:       { Classical: 2, Rock: 0.5, 'R&B': 1 },
  Classical:  { Jazz: 2, 'Hip-Hop': 0.5, Pop: 1 },
  Indie:      { Pop: 2, Electronic: 0.5, Rock: 1 },
  'R&B':      { Jazz: 2, Latin: 0.5, Pop: 1 },
  Latin:      { 'R&B': 2, Classical: 0.5, Pop: 1 },
  'K-Pop':    { Indie: 2, Rock: 0.5, Pop: 1 },
}

export function effectiveness(atkType, defType) {
  if (!atkType || !defType || atkType === defType) return 1
  const row = chart[atkType]
  if (!row) return 1
  return row[defType] ?? 1
}

export const WEATHER = [
  { id: 'clear',  name: 'Clear',  icon: '☀️',  boost: ['Pop', 'Latin'],        desc: 'Boosts Pop & Latin',   temp: 24 },
  { id: 'rain',   name: 'Rain',   icon: '🌧️', boost: ['Electronic', 'R&B'],    desc: 'Boosts Electronic & R&B', temp: 16 },
  { id: 'fog',    name: 'Fog',    icon: '🌫️', boost: ['Indie', 'Jazz'],        desc: 'Boosts Indie & Jazz',  temp: 12 },
  { id: 'snow',   name: 'Snow',   icon: '❄️', boost: ['Classical', 'Rock'],    desc: 'Boosts Classical & Rock', temp: 2 },
  { id: 'wind',   name: 'Wind',   icon: '🌬️', boost: ['Hip-Hop', 'K-Pop'],     desc: 'Boosts Hip-Hop & K-Pop', temp: 18 },
  { id: 'storm',  name: 'Storm',  icon: '⛈️', boost: ['Rock', 'Electronic'],   desc: 'Boosts Rock & Electronic', temp: 15 },
  { id: 'night',  name: 'Starlit',icon: '🌙',  boost: ['Jazz', 'Classical'],    desc: 'Boosts Jazz & Classical', temp: 10 },
]

export function weatherForDate(d = new Date()) {
  // pseudo-rotating weather so it feels alive; day-of-month driven + hourly jitter
  const seed = d.getDate() * 7 + d.getHours()
  return WEATHER[seed % WEATHER.length]
}

export const TEAMS = [
  { id: 'instinct', name: 'Team Instinct', color: '#facc15', icon: '⚡', desc: 'Trust your instincts.' },
  { id: 'mystic',   name: 'Team Mystic',   color: '#3b82f6', icon: '❄️', desc: 'Seek wisdom.' },
  { id: 'valor',    name: 'Team Valor',    color: '#ef4444', icon: '🔥', desc: 'Embrace strength.' },
]

export const LEAGUES = [
  { id: 'great',  name: 'Great League',  cap: 1200, icon: '🥉', color: '#d4a017' },
  { id: 'ultra',  name: 'Ultra League',  cap: 2500, icon: '🥈', color: '#9ca3af' },
  { id: 'master', name: 'Master League', cap: 99999, icon: '🥇', color: '#f59e0b' },
]

export const FRIEND_STAGES = [
  { level: 0, name: 'Friend',     xp: 0,    bonus: 0,   color: '#64748b' },
  { level: 1, name: 'Good Friend',xp: 50,   bonus: 0.03, color: '#22c55e' },
  { level: 2, name: 'Great Friend', xp: 200, bonus: 0.05, color: '#3b82f6' },
  { level: 3, name: 'Ultra Friend', xp: 1000, bonus: 0.07, color: '#a855f7' },
  { level: 4, name: 'Best Friend', xp: 3000, bonus: 0.10, color: '#f59e0b' },
]

export function friendStage(xp = 0) {
  let s = 0
  for (let i = 0; i < FRIEND_STAGES.length; i++) if (xp >= FRIEND_STAGES[i].xp) s = i
  return s
}
