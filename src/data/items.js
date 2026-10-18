// Full item catalog: discs (balls), berries, potions, revives, lures, boosters, passes.
export const ITEMS = [
  // catch discs
  { id: 'disc',   name: 'Catch Disc',     icon: '💿', cat: 'disc', mult: 1,   price: 0,   desc: 'Standard catch disc. 1× catch rate.' },
  { id: 'great',  name: 'Gold Disc',      icon: '📀', cat: 'disc', mult: 1.5, price: 200, desc: 'Better catch rate. 1.5×' },
  { id: 'ultra',  name: 'Platinum Disc',  icon: '💽', cat: 'disc', mult: 2,   price: 500, desc: 'High catch rate. 2×' },
  { id: 'premium',name: 'Master Disc',    icon: '💎', cat: 'disc', mult: 2.5, price: 0,   desc: 'Never fails. Raid rewards only.' },
  // berries
  { id: 'razz',    name: 'Razz Berry',    icon: '🍓', cat: 'berry', mult: 1.5, price: 50,  desc: 'Makes the next catch easier (1.5×).' },
  { id: 'nanab',   name: 'Nanab Berry',   icon: '🍌', cat: 'berry', calm: true, price: 80, desc: 'Calms the track — it stops dodging.' },
  { id: 'pinap',   name: 'Pinap Berry',   icon: '🍍', cat: 'berry', candy: 2, price: 100, desc: '+2× candy if caught.' },
  { id: 'golden',  name: 'Golden Razz',   icon: '🍊', cat: 'berry', mult: 2.5, price: 200, desc: 'Much easier catch (2.5×).' },
  // healing
  { id: 'potion',    name: 'Energy Drink', icon: '🥤', cat: 'potion', heal: 50,  price: 100, desc: 'Restores 50 HP in battle.' },
  { id: 'super',     name: 'Super Juice',  icon: '🧃', cat: 'potion', heal: 200, price: 250, desc: 'Restores 200 HP in battle.' },
  { id: 'hyper',     name: 'Hyper Tonic',  icon: '🧉', cat: 'potion', heal: 500, price: 500, desc: 'Restores 500 HP in battle.' },
  { id: 'maxpotion', name: 'Max Elixir',   icon: '🍷', cat: 'potion', heal: 9999, price: 800, desc: 'Fully restores HP.' },
  { id: 'revive',     name: 'Encore Revive', icon: '🔁', cat: 'revive', healPct: 0.5, price: 150, desc: 'Revives a fainted track at 50% HP.' },
  { id: 'maxrevive',  name: 'Full Encore',   icon: '🎆', cat: 'revive', healPct: 1,   price: 300, desc: 'Revives a fainted track at full HP.' },
  // location modifiers
  { id: 'lure',    name: 'Stage Lure',      icon: '🎤', cat: 'lure', duration: 1800, price: 300, desc: 'Attracts tracks to a stop for 30 min.' },
  { id: 'frostlure', name: 'Frost Lure',    icon: '❄️', cat: 'lure', duration: 1800, price: 350, desc: 'Attracts Classical & Rock tracks.' },
  { id: 'groovelure', name: 'Groove Lure',  icon: '🎷', cat: 'lure', duration: 1800, price: 350, desc: 'Attracts Jazz & R&B tracks.' },
  { id: 'basslure', name: 'Bass Lure',      icon: '📻', cat: 'lure', duration: 1800, price: 350, desc: 'Attracts Electronic tracks.' },
  { id: 'rainbowlure', name: 'Prism Lure', icon: '🌈', cat: 'lure', duration: 1800, price: 500, desc: 'Attracts rare & shiny tracks.' },
  // boosters
  { id: 'incense',   name: 'Incense',       icon: '🕯️', cat: 'booster', duration: 1800, price: 250, desc: 'Attracts tracks to you while walking.' },
  { id: 'luckyegg',  name: 'Lucky Egg',     icon: '🥚', cat: 'booster', duration: 1800, price: 200, desc: 'Double XP for 30 min.' },
  { id: 'incubator', name: 'Incubator',     icon: '🥚', cat: 'egg', uses: 999, price: 200, desc: 'Hatches eggs while walking (infinite).' },
  { id: 'superincubator', name: 'Turbo Incubator', icon: '⚙️', cat: 'egg', uses: 3, price: 300, desc: '1.5× hatch speed, 3 uses.' },
  { id: 'radar',     name: 'Track Radar',   icon: '📡', cat: 'booster', duration: 600, price: 400, desc: 'Reveals rare tracks nearby for 10 min.' },
  { id: 'raidpass',    name: 'Raid Pass',    icon: '🎫', cat: 'pass', price: 100, desc: 'Join a raid battle.' },
  { id: 'premiumpass', name: 'Premium Pass', icon: '🌟', cat: 'pass', price: 200, desc: 'Join any raid, any time.' },
  { id: 'giftbox',   name: 'Gift Box',      icon: '🎁', cat: 'gift', price: 50, desc: 'Wrap items into a gift for a friend.' },
  { id: 'megaring',  name: 'Mega Ring',     icon: '💍', cat: 'mega', price: 1000, desc: 'Unlocks Mega Evolution for a track.' },
  { id: 'costume',   name: 'Stage Costume', icon: '👘', cat: 'variant', price: 400, desc: 'Give a caught track a costume form.' },
  { id: 'camera',    name: 'Snapshot Cam',  icon: '📷', cat: 'tool', price: 150, desc: 'Take snapshots with your tracks.' },
  { id: 'storagepoke', name: 'Track Bag +50', icon: '🎒', cat: 'storage', price: 1000, desc: '+50 track storage.' },
  { id: 'storageitem', name: 'Item Case +50', icon: '📦', cat: 'storage', price: 1000, desc: '+50 item storage.' },
]

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]))
export const DISCS = ITEMS.filter(i => i.cat === 'disc')
export const BERRIES = ITEMS.filter(i => i.cat === 'berry')
export const POTIONS = ITEMS.filter(i => i.cat === 'potion')
export const REVIVES = ITEMS.filter(i => i.cat === 'revive')
export const LURES = ITEMS.filter(i => i.cat === 'lure')
export const BOOSTERS = ITEMS.filter(i => i.cat === 'booster')
export const STORAGE_ITEMS = ITEMS.filter(i => i.cat === 'storage')

// weighted item drop table for stop spins
export const DROP_TABLE = [
  ['disc', 30], ['razz', 18], ['potion', 8], ['revive', 5], ['great', 8],
  ['nanab', 6], ['pinap', 6], ['incense', 4], ['luckyegg', 3], ['ultra', 3],
  ['super', 4], ['hyper', 2], ['radar', 1], ['golden', 1], ['frostlure', 1],
  ['groovelure', 1], ['basslure', 1], ['rainbowlure', 0.5], ['giftbox', 3],
]

export function rollDrop(streakBonus = 1) {
  const total = DROP_TABLE.reduce((a, [, w]) => a + w, 0)
  let r = Math.random() * total * streakBonus
  for (const [id, w] of DROP_TABLE) {
    r -= w
    if (r <= 0) return id
  }
  return 'disc'
}
