export const ITEMS = [
  { id: 'ball', name: 'Catch Disc', icon: '💿', desc: 'Standard catch item. 1x catch rate.', price: 0, effect: 'catch', mult: 1 },
  { id: 'great', name: 'Gold Disc', icon: '📀', desc: 'Better catch rate. 1.5x.', price: 200, effect: 'catch', mult: 1.5 },
  { id: 'ultra', name: 'Platinum Disc', icon: '💎', desc: 'High catch rate. 2x.', price: 500, effect: 'catch', mult: 2 },
  { id: 'lure', name: 'Stage Lure', icon: '🎤', desc: 'Attracts rare tracks to a venue for 30 min.', price: 300, effect: 'lure' },
  { id: 'incense', name: 'Incense', icon: '🕯️', desc: 'Attracts tracks to you while walking.', price: 250, effect: 'incense' },
  { id: 'potion', name: 'Energy Drink', icon: '🥤', desc: 'Restores 50 HP to a track in battle.', price: 100, effect: 'heal', amount: 50 },
  { id: 'revive', name: 'Encore', icon: '🔁', desc: 'Revives a fainted track.', price: 150, effect: 'revive' },
  { id: 'radar', name: 'Radar', icon: '📡', desc: 'Reveals rare tracks on the map.', price: 400, effect: 'radar' },
  { id: 'berry', name: 'Razz Berry', icon: '🍓', desc: 'Makes next catch easier.', price: 50, effect: 'berry' },
  { id: 'incubator', name: 'Incubator', icon: '🥚', desc: 'Hatches eggs while walking.', price: 200, effect: 'incubator' },
  { id: 'raidpass', name: 'Raid Pass', icon: '🎫', desc: 'Join a raid battle.', price: 100, effect: 'raidpass' },
  { id: 'luckyegg', name: 'Lucky Egg', icon: '🥚', desc: 'Double XP for 30 min.', price: 200, effect: 'luckyegg' },
]
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]))
