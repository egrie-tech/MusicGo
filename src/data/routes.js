// Routes (tours) with waypoints, distance, rewards and Crescendo Cells.
export const ROUTES = [
  {
    id: 'route-1', name: 'Downtown Beat Walk', distanceM: 3000, cells: 5,
    waypoints: ['The Podium', 'Downbeat Diner', 'Amp Hall', 'Echo Lounge', 'Harmony Square'],
    reward: { xp: 1000, coins: 500, stardust: 300 },
    desc: 'A stroll through the city’s loudest blocks.',
  },
  {
    id: 'route-2', name: 'Riverside Riffs', distanceM: 5000, cells: 8,
    waypoints: ['Riff Records', 'Groove Box', 'Bassline Bar', 'The Samplery', 'Mixtape Market', 'Hi-Fi Shop', 'Turntable Tavern', 'Crescendo Café'],
    reward: { xp: 2000, coins: 800, stardust: 600 },
    desc: 'Follow the river and collect riffs along the way.',
  },
  {
    id: 'route-3', name: 'Festival Loop', distanceM: 8000, cells: 12,
    waypoints: ['Festival Grounds', 'Open Mic Park', 'The Backbeat', 'Concert Hall', 'Bass Arena', 'The Grand Stage', 'Encore Theater', 'Jazz Lounge', 'Record Store Arena', 'Underground Club', 'Harmony Square', 'The Crescendo'],
    reward: { xp: 4000, coins: 1500, stardust: 1200 },
    desc: 'The full festival circuit. Bring water.',
  },
  {
    id: 'route-4', name: 'Classical Heritage Trail', distanceM: 4000, cells: 6,
    waypoints: ['Acoustic Corner', 'Lo-Fi Loft', 'Reel-to-Reel', 'Cymbal Shop', 'Note Stop', 'The Podium'],
    reward: { xp: 1500, coins: 600, stardust: 500 },
    desc: 'Trace the roots of the old masters.',
  },
]

export const CELL_GOAL = 20 // Crescendo Cells needed to summon the Maestro track
export const CELL_TRACK_ID = 46 // 'Crescendo' — the route master reward
