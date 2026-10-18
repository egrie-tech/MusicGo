// Research: Field (from stop spins), Special (story campaign), Timed and Seasonal.
export const FIELD_TASKS = [
  { id: 'catch3',    text: 'Catch 3 tracks',            type: 'catches',   target: 3,   reward: { xp: 100, coins: 100 } },
  { id: 'catch5',    text: 'Catch 5 tracks',            type: 'catches',   target: 5,   reward: { xp: 150, item: 'disc', qty: 5 } },
  { id: 'catch10',   text: 'Catch 10 tracks',           type: 'catches',   target: 10,  reward: { xp: 300, item: 'great', qty: 1 } },
  { id: 'genre-pop', text: 'Catch 2 Pop tracks',        type: 'catchGenre', genre: 'Pop', target: 2, reward: { xp: 120, coins: 150 } },
  { id: 'genre-rock',text: 'Catch 2 Rock tracks',       type: 'catchGenre', genre: 'Rock', target: 2, reward: { xp: 120, item: 'potion', qty: 2 } },
  { id: 'genre-elec',text: 'Catch 2 Electronic tracks', type: 'catchGenre', genre: 'Electronic', target: 2, reward: { xp: 120, item: 'ultra', qty: 1 } },
  { id: 'rare1',     text: 'Catch 1 rare+ track',       type: 'catchRarity', rarity: 'rare', target: 1, reward: { xp: 250, item: 'radar', qty: 1 } },
  { id: 'spin3',     text: 'Spin 3 stop discs',         type: 'spins',     target: 3,   reward: { xp: 80, item: 'razz', qty: 3 } },
  { id: 'spin5',     text: 'Spin 5 stop discs',         type: 'spins',     target: 5,   reward: { xp: 150, coins: 120 } },
  { id: 'walk1k',    text: 'Walk 1 km',                 type: 'walk',      target: 1000, reward: { xp: 100, item: 'incubator', qty: 1 } },
  { id: 'walk3k',    text: 'Walk 3 km',                 type: 'walk',      target: 3000, reward: { xp: 250, coins: 200 } },
  { id: 'win1',      text: 'Win 1 battle',              type: 'battles',   target: 1,   reward: { xp: 200, coins: 250 } },
  { id: 'win3',      text: 'Win 3 battles',             type: 'battles',   target: 3,   reward: { xp: 400, item: 'raidpass', qty: 1 } },
  { id: 'hatch1',    text: 'Hatch 1 egg',               type: 'hatches',   target: 1,   reward: { xp: 300, item: 'superincubator', qty: 1 } },
  { id: 'evolve1',   text: 'Evolve 1 track',            type: 'evolutions', target: 1,  reward: { xp: 200, coins: 150 } },
  { id: 'transfer3', text: 'Transfer 3 tracks',         type: 'transfers', target: 3,   reward: { xp: 100, item: 'disc', qty: 5 } },
  { id: 'nice3',     text: 'Make 3 Nice+ throws',       type: 'throws',    target: 3,   reward: { xp: 120, item: 'razz', qty: 2 } },
  { id: 'curve3',    text: 'Make 3 curveball throws',   type: 'curveballs', target: 3,  reward: { xp: 120, item: 'great', qty: 1 } },
  { id: 'powerup2',  text: 'Power up 2 tracks',         type: 'powerups',  target: 2,   reward: { xp: 180, stardust: 300 } },
  { id: 'berry2',    text: 'Use 2 berries',             type: 'berries',   target: 2,   reward: { xp: 100, item: 'pinap', qty: 1 } },
]

export const SPECIAL_RESEARCH = {
  id: 'lost-session',
  title: 'The Lost Session',
  desc: 'A mysterious recording has surfaced. Complete the sessions to uncover it.',
  steps: [
    { text: 'Session 1: catch 5 tracks', tasks: [{ type: 'catches', target: 5 }], reward: { xp: 500, coins: 500, item: 'ultra', qty: 1 } },
    { text: 'Session 2: walk 2 km and spin 5 discs', tasks: [{ type: 'walk', target: 2000 }, { type: 'spins', target: 5 }], reward: { xp: 800, stardust: 500 } },
    { text: 'Session 3: win 3 battles', tasks: [{ type: 'battles', target: 3 }], reward: { xp: 1000, coins: 800 } },
    { text: 'Session 4: hatch 2 eggs', tasks: [{ type: 'hatches', target: 2 }], reward: { xp: 1200, item: 'premium', qty: 1 } },
    { text: 'Session 5: catch a legendary track', tasks: [{ type: 'catchLegendary', target: 1 }], reward: { xp: 2000, stardust: 2000 } },
    { text: 'Final: claim the Lost Session master tape', tasks: [], reward: { trackId: 24, xp: 3000 } },
  ],
}

// Timed research: valid for a window around "now" (month-based)
export const TIMED_RESEARCH = [
  { id: 'timed-month', title: 'Monthly Marathon', windowDays: 30, steps: [
    { text: 'Catch 20 tracks this month', tasks: [{ type: 'catches', target: 20 }], reward: { xp: 1500, item: 'premiumpass', qty: 1 } },
    { text: 'Walk 15 km this month', tasks: [{ type: 'walk', target: 15000 }], reward: { xp: 1500, stardust: 1500 } },
    { text: 'Win 10 battles this month', tasks: [{ type: 'battles', target: 10 }], reward: { xp: 2000, coins: 2000 } },
  ]},
]

// Seasonal research cycles with the month
export const SEASONAL_RESEARCH = [
  { id: 'season-winter', months: [11, 0, 1], title: 'Winter Resonance', steps: [
    { text: 'Catch 10 Classical tracks', tasks: [{ type: 'catchGenre', genre: 'Classical', target: 10 }], reward: { xp: 1000, stardust: 1000 } },
  ]},
  { id: 'season-spring', months: [2, 3, 4], title: 'Spring Bloom', steps: [
    { text: 'Catch 10 Indie tracks', tasks: [{ type: 'catchGenre', genre: 'Indie', target: 10 }], reward: { xp: 1000, item: 'rainbowlure', qty: 1 } },
  ]},
  { id: 'season-summer', months: [5, 6, 7], title: 'Summer Stage', steps: [
    { text: 'Catch 10 Latin tracks', tasks: [{ type: 'catchGenre', genre: 'Latin', target: 10 }], reward: { xp: 1000, coins: 1500 } },
  ]},
  { id: 'season-autumn', months: [8, 9, 10], title: 'Autumn Echo', steps: [
    { text: 'Catch 10 Jazz tracks', tasks: [{ type: 'catchGenre', genre: 'Jazz', target: 10 }], reward: { xp: 1000, item: 'groovelure', qty: 1 } },
  ]},
]
