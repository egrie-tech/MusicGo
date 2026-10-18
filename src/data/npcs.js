// NPCs: simulated friends, rival trainers, Team Static (the villain faction).
export const FRIEND_POOL = [
  { name: 'DJ Nova', avatar: '🎛️', level: 14 },
  { name: 'BeatRider', avatar: '🛹', level: 9 },
  { name: 'SynthQueen', avatar: '👑', level: 22 },
  { name: 'LoFiLarry', avatar: '🧢', level: 6 },
  { name: 'VinylVera', avatar: '💿', level: 31 },
  { name: 'BassHunter', avatar: '🎯', level: 17 },
  { name: 'ChorusKai', avatar: '🎤', level: 12 },
  { name: 'RiffRaff', avatar: '🎸', level: 19 },
]

export const TRAINERS = [
  { name: 'Busker Ben',   avatar: '🎸', level: 8,  team: [1, 2, 7] },
  { name: 'Melody Mara',  avatar: '🎷', level: 12, team: [5, 8, 12] },
  { name: 'Rave Rover',   avatar: '🎹', level: 16, team: [11, 28, 41] },
  { name: 'Headliner Hank', avatar: '🎤', level: 20, team: [13, 20, 45] },
  { name: 'Maestro Mia',  avatar: '🎻', level: 26, team: [16, 24, 35] },
]

// Team Static (the "Rocket" analogue) — grunts, leaders, and the Magnate.
export const ROCKET_GRUNTS = [
  { name: 'Static Grunt', avatar: '🕴️', level: 10, team: [3, 4, 32] },
  { name: 'Bootleg Bruiser', avatar: '🥷', level: 14, team: [14, 27, 42] },
  { name: 'Pirate Pete', avatar: '🏴‍☠️', level: 18, team: [13, 23, 27] },
]
export const ROCKET_LEADERS = [
  { name: 'Feedback',  avatar: '📢', level: 24, team: [22, 34, 21] },
  { name: 'Vinyl Vandal', avatar: '💥', level: 27, team: [39, 13, 30] },
  { name: 'DJ Dissonance', avatar: '🎚️', level: 30, team: [36, 45, 23] },
]
export const ROCKET_BOSS = { name: 'The Magnate', avatar: '🧿', level: 35, team: [34, 24, 26] }

// Shadow pool: tracks that can appear corrupted after Team Static battles
export const SHADOW_POOL = [1, 3, 4, 13, 14, 20, 22, 23, 27, 30, 34, 39, 41, 44, 45]
