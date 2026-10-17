// Type chart (music genres as types). Mult: 2 super, 0.5 not very, 1 normal.
export const TYPES = ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Indie', 'R&B', 'Latin', 'K-Pop']

const chart = {
  'Pop': { 'Rock': 2, 'Indie': 0.5, 'Hip-Hop': 1 },
  'Hip-Hop': { 'Pop': 2, 'Classical': 0.5, 'Rock': 1 },
  'Rock': { 'Electronic': 2, 'Pop': 0.5, 'Jazz': 1 },
  'Electronic': { 'Rock': 2, 'Acoustic': 0.5, 'Pop': 1 },
  'Jazz': { 'Classical': 2, 'Rock': 0.5, 'R&B': 1 },
  'Classical': { 'Jazz': 2, 'Hip-Hop': 0.5, 'Pop': 1 },
  'Indie': { 'Pop': 2, 'Electronic': 0.5, 'Rock': 1 },
  'R&B': { 'Jazz': 2, 'Latin': 0.5, 'Pop': 1 },
  'Latin': { 'R&B': 2, 'Classical': 0.5, 'Pop': 1 },
  'K-Pop': { 'Indie': 2, 'Rock': 0.5, 'Pop': 1 },
}

export function effectiveness(atkType, defType) {
  const row = chart[atkType]
  if (!row) return 1
  if (row[defType] !== undefined) return row[defType]
  return 1
}

export const WEATHER = [
  { id: 'clear', name: 'Clear', icon: '☀️', boost: ['Pop', 'Latin'], desc: 'Boosts Pop & Latin' },
  { id: 'rain', name: 'Rain', icon: '🌧️', boost: ['Electronic', 'R&B'], desc: 'Boosts Electronic & R&B' },
  { id: 'fog', name: 'Fog', icon: '🌫️', boost: ['Indie', 'Jazz'], desc: 'Boosts Indie & Jazz' },
  { id: 'snow', name: 'Snow', icon: '❄️', boost: ['Classical', 'Rock'], desc: 'Boosts Classical & Rock' },
  { id: 'wind', name: 'Wind', icon: '🌬️', boost: ['Hip-Hop', 'K-Pop'], desc: 'Boosts Hip-Hop & K-Pop' },
  { id: 'storm', name: 'Storm', icon: '⛈️', boost: ['Rock', 'Electronic'], desc: 'Boosts Rock & Electronic' },
]

export function randomWeather() {
  return WEATHER[Math.floor(Math.random() * WEATHER.length)]
}

export const TEAMS = [
  { id: 'instinct', name: 'Team Instinct', color: '#facc15', icon: '⚡', desc: 'Trust your instincts.' },
  { id: 'mystic', name: 'Team Mystic', color: '#3b82f6', icon: '❄️', desc: 'Seek wisdom.' },
  { id: 'valor', name: 'Team Valor', color: '#ef4444', icon: '🔥', desc: 'Embrace strength.' },
]
