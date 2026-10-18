import { useSyncExternalStore, useCallback, useState } from 'react'
import { TRACKS, TRACK_BY_ID, RARITY, rollShiny } from '../data/tracks'
import { ITEMS, ITEM_BY_ID, rollDrop } from '../data/items'
import { getEvolution } from '../data/evolutions'
import { weatherForDate, friendStage } from '../data/types'
import { FIELD_TASKS } from '../data/research'
import { ROUTES, CELL_TRACK_ID } from '../data/routes'
import { SHADOW_POOL } from '../data/npcs'
import { computeCp, computeHp, rollIvs, catchSuccessRate, dayId, weekId } from '../utils/game'
import { eventCatchXp, eventStardustMult } from '../data/events'

const STORAGE_KEY = 'musicgo-store-v3'
const XP_PER_LEVEL = (lvl) => 100 * lvl * (lvl + 1) / 2
const uid = (p = 'id') => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
const today = () => dayId(new Date())

const emptyStats = () => ({
  catches: 0, spins: 0, battles: 0, battleWins: 0, hatches: 0, evolutions: 0,
  transfers: 0, niceThrows: 0, curveballs: 0, powerups: 0, berries: 0,
  raidsWon: 0, rocketWins: 0, trades: 0, giftsSent: 0, giftsOpened: 0,
  snapshots: 0, megaEvolves: 0, purifies: 0, routesCompleted: 0, gymBattles: 0, listens: 0,
  genreCatches: {}, rarityCatches: {},
})

const initialState = {
  profile: { name: 'Player', level: 1, xp: 0, coins: 500, avatar: '🎧', title: 'Rookie Listener', battlesWon: 0, distance: 0, team: null, stardust: 250, joined: Date.now() },
  collection: {}, // uid -> instance
  pokedex: {},    // trackId -> { seen, caught, shiny, shadow, mega, costume }
  candy: {}, megaEnergy: {},
  inventory: { disc: 20, great: 3, ultra: 1, razz: 5, nanab: 2, pinap: 2, potion: 3, revive: 1, lure: 1, incense: 1, raidpass: 1, incubator: 1, luckyegg: 1, giftbox: 1, camera: 1 },
  trackStorage: 300, itemStorage: 350,
  effects: { incenseUntil: 0, luckyEggUntil: 0, radarUntil: 0 },
  weather: weatherForDate(),
  spawns: [], pois: [], raids: [],
  stats: emptyStats(),
  eggs: [], incubators: [{ id: 'inc-inf', type: 'Infinite', uses: 999999, speed: 1 }],
  eggsCollected: 0, hatched: 0,
  buddy: null, // { uid, totalHearts, heartsToday, heartDay, candyProgressM, candyFound, lastPhotoDay, lastPlayDay, lastFeedDay, battlesToday }
  research: { field: [], specialStep: 0, specialStart: null, timedStep: 0, timedStart: null, seasonalStep: 0, seasonalStart: null, specialDone: false },
  daily: { date: today(), catchStreak: 0, stopStreak: 0, caughtToday: false, spunToday: false, freeClaimed: false, specialTradeUsed: false },
  weekly: { week: weekId(), distance: 0, claimed: [] },
  friends: [], giftsHeld: 0, tradeLog: [],
  party: null, // { code, members:[names], challenges:[{id,text,type,target,start,done}] }
  routeState: { activeId: null, waypoint: 0, walkedM: 0, cells: 0, completed: [], lastEvent: null },
  postcards: [], snapshots: [], league: { rating: 1000, wins: 0, battles: 0, setsToday: 0, setDay: today() },
  gymCoinsToday: { date: today(), earned: 0 },
  eventClaims: {}, settings: { sound: true, units: 'metric', ar: false },
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const s = parsed?.state || parsed
      if (s && typeof s === 'object') {
        const merged = { ...initialState, ...s }
        merged.profile = { ...initialState.profile, ...(s.profile || {}) }
        merged.stats = { ...emptyStats(), ...(s.stats || {}) }
        merged.research = { ...initialState.research, ...(s.research || {}) }
        merged.effects = { ...initialState.effects, ...(s.effects || {}) }
        if (!merged.weather) merged.weather = weatherForDate()
        for (const k of ['spawns', 'pois', 'raids', 'eggs', 'friends', 'postcards', 'snapshots', 'tradeLog']) if (!Array.isArray(merged[k])) merged[k] = []
        for (const k of ['collection', 'pokedex', 'candy', 'megaEnergy', 'inventory']) if (!merged[k] || typeof merged[k] !== 'object') merged[k] = {}
        return merged
      }
    }
  } catch (e) { /* fresh start */ }
  return structuredClone(initialState)
}

let _state = loadPersisted()
const listeners = new Set()
function _setState(partial) {
  const next = typeof partial === 'function' ? partial(_state) : partial
  _state = { ..._state, ...next }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: _state })) } catch (e) { /* storage full */ }
  listeners.forEach(l => l())
}
function subscribe(l) { listeners.add(l); return () => listeners.delete(l) }
function getMergedState() { return { ..._state, ...actions } }
function getState() { return getMergedState() }

// ---------- helpers ----------
function titleForLevel(level) {
  const titles = ['Rookie Listener', 'Street Listener', 'Beat Seeker', 'Groove Walker', 'Stage Regular', 'Headliner', 'Legend', 'Icon', 'Maestro', 'MusicGo Champion']
  return titles[Math.min(titles.length - 1, Math.floor((level - 1) / 3))]
}
function xpPatch(profile, amount) {
  let xp = profile.xp + amount, level = profile.level
  while (xp >= XP_PER_LEVEL(level + 1)) level++
  return { ...profile, xp, level, title: titleForLevel(level) }
}
function makeInstance(trackId, opts = {}) {
  const track = TRACK_BY_ID[trackId]
  const level = opts.level || Math.max(1, Math.min(40, Math.round(5 + Math.random() * 20 + (track.rarity === 'legendary' ? 10 : 0))))
  const ivs = opts.ivs || rollIvs()
  const cp = computeCp(track, level, ivs)
  const maxHp = computeHp(track, level, ivs)
  return {
    uid: uid('trk'), trackId, level, ivs, cp, hp: maxHp, maxHp,
    shiny: !!opts.shiny, shadow: !!opts.shadow, mega: false, megaUntil: 0,
    favorite: false, tags: [], costume: opts.costume || null, form: opts.form || track.forms?.[0] || 'Original',
    caughtAt: Date.now(), source: opts.source || 'wild', lucky: !!opts.lucky,
  }
}
function registerDex(trackId, patch) {
  const cur = _state.pokedex[trackId] || { seen: false, caught: false }
  _setState(s => ({ pokedex: { ...s.pokedex, [trackId]: { ...cur, ...patch, seen: true } } }))
}
function applyReward(reward = {}) {
  if (!reward) return
  if (reward.xp) actions.addXp(reward.xp)
  if (reward.coins) actions.addCoins(reward.coins)
  if (reward.stardust) actions.addStardust(reward.stardust)
  if (reward.item) actions.addItem(reward.item, reward.qty || 1)
  if (reward.candy && reward.trackId) _setState(s => ({ candy: { ...s.candy, [reward.trackId]: (s.candy[reward.trackId] || 0) + reward.candy } }))
  if (reward.trackId) actions.grantTrack(reward.trackId, { source: 'research' })
}
function statSnapshot(stats, type, task = {}) {
  switch (type) {
    case 'catches': return stats.catches
    case 'spins': return stats.spins
    case 'walk': return Math.round(_state.profile.distance)
    case 'battles': return stats.battleWins
    case 'hatches': return stats.hatches
    case 'evolutions': return stats.evolutions
    case 'transfers': return stats.transfers
    case 'throws': return stats.niceThrows
    case 'curveballs': return stats.curveballs
    case 'powerups': return stats.powerups
    case 'berries': return stats.berries
    case 'catchGenre': return stats.genreCatches[task.genre] || 0
    case 'catchRarity': {
      const order = ['rare', 'epic', 'legendary']; const min = order.indexOf(task.rarity || 'rare')
      return order.slice(Math.max(0, min)).reduce((a, r) => a + (stats.rarityCatches[r] || 0), 0)
    }
    case 'catchLegendary': return stats.rarityCatches.legendary || 0
    default: return 0
  }
}
function bumpDaily(kind) {
  const d = _state.daily
  if (d.date !== today()) {
    _setState(s => ({ daily: { date: today(), catchStreak: kind === 'catch' ? 1 : 0, stopStreak: kind === 'spin' ? 1 : 0, caughtToday: kind === 'catch', spunToday: kind === 'spin', freeClaimed: false, specialTradeUsed: false } }))
    return
  }
  const patch = {}
  if (kind === 'catch' && !d.caughtToday) { patch.caughtToday = true; patch.catchStreak = (d.catchStreak || 0) + 1 }
  if (kind === 'spin' && !d.spunToday) { patch.spunToday = true; patch.stopStreak = (d.stopStreak || 0) + 1 }
  if (Object.keys(patch).length) _setState(s => ({ daily: { ...s.daily, ...patch } }))
}

const actions = {
  // ----- profile / currencies -----
  setName: (name) => _setState(s => ({ profile: { ...s.profile, name } })),
  setAvatar: (avatar) => _setState(s => ({ profile: { ...s.profile, avatar } })),
  setTeam: (team) => _setState(s => ({ profile: { ...s.profile, team } })),
  addXp: (amount) => {
    const mult = _state.effects.luckyEggUntil > Date.now() ? 2 : 1
    _setState(s => ({ profile: xpPatch(s.profile, Math.round(amount * mult)) }))
  },
  addCoins: (amount) => _setState(s => ({ profile: { ...s.profile, coins: s.profile.coins + amount } })),
  addStardust: (amount) => _setState(s => ({ profile: { ...s.profile, stardust: (s.profile.stardust || 0) + amount } })),
  spendCoins: (amount) => { if (_state.profile.coins < amount) return false; _setState(s => ({ profile: { ...s.profile, coins: s.profile.coins - amount } })); return true },
  spendStardust: (amount) => { if ((_state.profile.stardust || 0) < amount) return false; _setState(s => ({ profile: { ...s.profile, stardust: s.profile.stardust - amount } })); return true },
  setWeather: (w) => _setState({ weather: w }),
  refreshWeather: () => _setState({ weather: weatherForDate(new Date()) }),
  reset: () => _setState(structuredClone(initialState)),

  // ----- inventory -----
  addItem: (itemId, qty = 1) => _setState(s => ({ inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] || 0) + qty } })),
  consumeItem: (itemId) => { if ((_state.inventory[itemId] || 0) <= 0) return false; _setState(s => ({ inventory: { ...s.inventory, [itemId]: s.inventory[itemId] - 1 } })); return true },
  itemCount: () => Object.values(_state.inventory).reduce((a, b) => a + b, 0),
  buyItem: (itemId, qty = 1) => {
    const item = ITEM_BY_ID[itemId]; if (!item || item.price <= 0) return false
    if (!actions.spendCoins(item.price * qty)) return false
    if (itemId === 'storagepoke') _setState(s => ({ trackStorage: s.trackStorage + 50 }))
    else if (itemId === 'storageitem') _setState(s => ({ itemStorage: s.itemStorage + 50 }))
    else actions.addItem(itemId, qty)
    return true
  },
  activateBooster: (itemId) => {
    const item = ITEM_BY_ID[itemId]; if (!item) return false
    if (!actions.consumeItem(itemId)) return false
    const until = Date.now() + (item.duration || 1800) * 1000
    if (itemId === 'incense') _setState(s => ({ effects: { ...s.effects, incenseUntil: until } }))
    else if (itemId === 'luckyegg') _setState(s => ({ effects: { ...s.effects, luckyEggUntil: until } }))
    else if (itemId === 'radar') _setState(s => ({ effects: { ...s.effects, radarUntil: until } }))
    return true
  },

  // ----- catching -----
  grantTrack: (trackId, opts = {}) => {
    const track = TRACK_BY_ID[trackId]; if (!track) return null
    const inst = makeInstance(trackId, opts)
    _setState(s => ({ collection: { ...s.collection, [inst.uid]: inst } }))
    registerDex(trackId, { caught: true, shiny: inst.shiny || _state.pokedex[trackId]?.shiny, shadow: inst.shadow || undefined })
    return inst
  },
  attemptCatch: ({ trackId, ballMult = 1, berryMult = 1, berryId = null, curveball = false, qualityMult = 1, quality = 'OK', weatherBoost = false, source = 'wild', shadow = false }) => {
    const track = TRACK_BY_ID[trackId]; if (!track) return { success: false }
    const rate = catchSuccessRate({ track, ballMult, berryMult, curveball, qualityMult, weatherBoost })
    const critical = quality !== 'OK' && Math.random() < 0.04
    const success = critical || Math.random() < rate
    if (berryId) _setState(s => ({ stats: { ...s.stats, berries: s.stats.berries + 1 } }))
    if (curveball) _setState(s => ({ stats: { ...s.stats, curveballs: s.stats.curveballs + 1 } }))
    if (['Nice', 'Great', 'Excellent'].includes(quality)) _setState(s => ({ stats: { ...s.stats, niceThrows: s.stats.niceThrows + 1 } }))
    if (!success) {
      const fleeChance = track.rarity === 'legendary' ? 0.25 : track.rarity === 'epic' ? 0.18 : 0.10
      return { success: false, fled: Math.random() < fleeChance, rate, critical: false }
    }
    const shiny = rollShiny(track)
    const inst = makeInstance(trackId, { shiny, shadow, source })
    const candyBase = track.rarity === 'legendary' ? 10 : track.rarity === 'epic' ? 7 : track.rarity === 'rare' ? 5 : 3
    const candyGain = candyBase * (berryId === 'pinap' ? 2 : 1)
    const xpGain = Math.round((track.xp || RARITY[track.rarity].xp) * eventCatchXp() * (quality === 'Excellent' ? 2 : quality === 'Great' ? 1.5 : quality === 'Nice' ? 1.2 : 1))
    const dust = Math.round(100 * eventStardustMult())
    _setState(s => ({
      collection: { ...s.collection, [inst.uid]: inst },
      candy: { ...s.candy, [trackId]: (s.candy[trackId] || 0) + candyGain },
      stats: {
        ...s.stats, catches: s.stats.catches + 1,
        genreCatches: { ...s.stats.genreCatches, [track.genre]: (s.stats.genreCatches[track.genre] || 0) + 1 },
        rarityCatches: { ...s.stats.rarityCatches, [track.rarity]: (s.stats.rarityCatches[track.rarity] || 0) + 1 },
      },
    }))
    registerDex(trackId, { caught: true, shiny: shiny || undefined })
    actions.addXp(xpGain); actions.addCoins(Math.round(xpGain / 3)); actions.addStardust(dust)
    bumpDaily('catch')
    return { success: true, inst, xp: xpGain, coins: Math.round(xpGain / 3), candy: candyGain, stardust: dust, rate, critical, shiny }
  },

  // ----- listening -----
  recordListen: (uid) => {
    if (!uid) return
    _setState(s => {
      const inst = s.collection[uid]
      return {
        stats: { ...s.stats, listens: (s.stats.listens || 0) + 1 },
        collection: inst ? { ...s.collection, [uid]: { ...inst, playCount: (inst.playCount || 0) + 1, lastPlayedAt: Date.now() } } : s.collection,
      }
    })
  },

  // ----- collection management -----
  updateInstance: (uid, patch) => _setState(s => s.collection[uid] ? ({ collection: { ...s.collection, [uid]: { ...s.collection[uid], ...patch } } }) : ({})),
  toggleFavorite: (uid) => _setState(s => s.collection[uid] ? ({ collection: { ...s.collection, [uid]: { ...s.collection[uid], favorite: !s.collection[uid].favorite } } }) : ({})),
  setTags: (uid, tags) => actions.updateInstance(uid, { tags }),
  setForm: (uid, form) => actions.updateInstance(uid, { form }),
  applyCostume: (uid) => {
    const inst = _state.collection[uid]; if (!inst) return false
    if (!actions.consumeItem('costume')) return false
    actions.updateInstance(uid, { costume: 'Stage Outfit' })
    registerDex(inst.trackId, { costume: true })
    return true
  },
  powerUp: (uid) => {
    const inst = _state.collection[uid]; if (!inst || inst.level >= 50) return false
    const track = TRACK_BY_ID[inst.trackId]
    const dustCost = 200 + inst.level * 100, candyCost = 1 + Math.floor(inst.level / 10)
    if ((_state.profile.stardust || 0) < dustCost || (_state.candy[inst.trackId] || 0) < candyCost) return false
    actions.spendStardust(dustCost)
    _setState(s => ({ candy: { ...s.candy, [inst.trackId]: s.candy[inst.trackId] - candyCost }, stats: { ...s.stats, powerups: s.stats.powerups + 1 } }))
    const level = inst.level + 1
    actions.updateInstance(uid, { level, cp: computeCp(track, level, inst.ivs), maxHp: computeHp(track, level, inst.ivs), hp: computeHp(track, level, inst.ivs) })
    return true
  },
  evolve: (uid) => {
    const inst = _state.collection[uid]; if (!inst) return { ok: false, reason: 'Missing track' }
    const evo = getEvolution(inst.trackId); if (!evo) return { ok: false, reason: 'No evolution' }
    if ((_state.candy[inst.trackId] || 0) < evo.candy) return { ok: false, reason: `Need ${evo.candy} candy` }
    _setState(s => ({ candy: { ...s.candy, [inst.trackId]: s.candy[inst.trackId] - evo.candy }, stats: { ...s.stats, evolutions: s.stats.evolutions + 1 } }))
    const track = TRACK_BY_ID[evo.to]
    actions.updateInstance(uid, { trackId: evo.to, cp: computeCp(track, inst.level, inst.ivs), maxHp: computeHp(track, inst.level, inst.ivs), hp: computeHp(track, inst.level, inst.ivs), form: 'Original' })
    registerDex(evo.to, { caught: true })
    actions.addXp(500)
    return { ok: true, to: evo.to }
  },
  megaEvolve: (uid) => {
    const inst = _state.collection[uid]; if (!inst) return false
    const track = TRACK_BY_ID[inst.trackId]; if (!track?.mega) return false
    const have = _state.megaEnergy[inst.trackId] || 0
    if (have < track.mega.energy && !inst.mega) return false
    if (!inst.mega) _setState(s => ({ megaEnergy: { ...s.megaEnergy, [inst.trackId]: have - track.mega.energy }, stats: { ...s.stats, megaEvolves: s.stats.megaEvolves + 1 } }))
    actions.updateInstance(uid, { mega: true, megaUntil: Date.now() + 8 * 3600 * 1000, cp: Math.round(inst.cp * track.mega.mult) })
    registerDex(inst.trackId, { mega: true })
    return true
  },
  purify: (uid) => {
    const inst = _state.collection[uid]; if (!inst || !inst.shadow) return false
    const dust = 1000, candyCost = 5
    if ((_state.profile.stardust || 0) < dust || (_state.candy[inst.trackId] || 0) < candyCost) return false
    actions.spendStardust(dust)
    _setState(s => ({ candy: { ...s.candy, [inst.trackId]: (s.candy[inst.trackId] || 0) - candyCost }, stats: { ...s.stats, purifies: s.stats.purifies + 1 } }))
    const ivs = { a: Math.min(15, inst.ivs.a + 2), d: Math.min(15, inst.ivs.d + 2), s: Math.min(15, inst.ivs.s + 2) }
    const track = TRACK_BY_ID[inst.trackId]; const level = Math.min(50, inst.level + 5)
    actions.updateInstance(uid, { shadow: false, ivs, level, cp: computeCp(track, level, ivs), maxHp: computeHp(track, level, ivs), hp: computeHp(track, level, ivs) })
    actions.addXp(300)
    return true
  },
  transfer: (uid) => {
    const inst = _state.collection[uid]; if (!inst || inst.favorite) return false
    const col = { ..._state.collection }; delete col[uid]
    _setState(s => ({ collection: col, candy: { ...s.candy, [inst.trackId]: (s.candy[inst.trackId] || 0) + 1 }, stats: { ...s.stats, transfers: s.stats.transfers + 1 } }))
    if (_state.buddy?.uid === uid) _setState({ buddy: null })
    return true
  },
  healInstance: (uid, itemId) => {
    const inst = _state.collection[uid]; const item = ITEM_BY_ID[itemId]; if (!inst || !item) return false
    if (!actions.consumeItem(itemId)) return false
    if (item.cat === 'revive') { if (inst.hp > 0) return false; actions.updateInstance(uid, { hp: Math.round(inst.maxHp * (item.healPct || 0.5)) }) }
    else actions.updateInstance(uid, { hp: Math.min(inst.maxHp, inst.hp + (item.heal || 0)) })
    return true
  },
  setInstanceHp: (uid, hp) => actions.updateInstance(uid, { hp: Math.max(0, Math.round(hp)) }),

  // ----- map: spawns & POIs -----
  setSpawns: (spawns) => _setState({ spawns }),
  addSpawn: (spawn) => _setState(s => ({ spawns: [...s.spawns.filter(x => x.id !== spawn.id), spawn] })),
  removeSpawn: (id) => _setState(s => ({ spawns: s.spawns.filter(x => x.id !== id) })),
  setPois: (pois) => _setState(s => {
    const byId = Object.fromEntries(s.pois.map(p => [p.id, p]))
    return { pois: pois.map(p => byId[p.id] ? { ...p, ...byId[p.id], lat: p.lat, lng: p.lng, name: p.name, kind: p.kind } : p) }
  }),
  updatePoi: (poiId, patch) => _setState(s => ({ pois: s.pois.map(p => p.id === poiId ? { ...p, ...patch } : p) })),
  spinPoi: (poiId) => {
    const poi = _state.pois.find(p => p.id === poiId); if (!poi) return null
    const now = Date.now()
    if (now - (poi.lastSpin || 0) < 5 * 60 * 1000) return { cooldown: true, poi }
    const streakBonus = _state.daily.date === today() && !_state.daily.spunToday ? 1.5 : 1
    const dropCount = poi.kind === 'gym' ? 4 : 3
    const loot = []
    for (let i = 0; i < dropCount; i++) { const id = rollDrop(streakBonus); loot.push(id); actions.addItem(id, 1) }
    const gotGift = Math.random() < 0.3, gotEgg = Math.random() < 0.25 && _state.eggs.length < 9, gotPostcard = Math.random() < 0.4
    if (gotGift) _setState(s => ({ giftsHeld: s.giftsHeld + 1 }))
    if (gotEgg) actions.addEgg()
    if (gotPostcard && poi.postcardRegion) actions.addPostcard({ region: poi.postcardRegion, name: poi.name, source: poi.name })
    let researchTask = null
    if (poi.kind === 'stop' && _state.research.field.length < 3 && Math.random() < 0.7) {
      researchTask = FIELD_TASKS[Math.floor(Math.random() * FIELD_TASKS.length)]
      actions.addFieldTask(researchTask)
    }
    actions.addXp(50); bumpDaily('spin')
    _setState(s => ({
      stats: { ...s.stats, spins: s.stats.spins + 1 },
      pois: s.pois.map(p => p.id === poiId ? { ...p, lastSpin: now, badge: { ...(p.badge || {}), visits: (p.badge?.visits || 0) + 1, spins: (p.badge?.spins || 0) + 1 } } : p),
    }))
    return { loot, gift: gotGift, egg: gotEgg, postcard: gotPostcard, researchTask, poi }
  },
  placeLure: (poiId, lureId) => {
    const item = ITEM_BY_ID[lureId]; if (!item || item.cat !== 'lure') return false
    if (!actions.consumeItem(lureId)) return false
    const genres = { frostlure: ['Classical', 'Rock'], groovelure: ['Jazz', 'R&B'], basslure: ['Electronic'], rainbowlure: [] }[lureId] || null
    actions.updatePoi(poiId, { lure: { itemId: lureId, until: Date.now() + item.duration * 1000, genres, by: _state.profile.name } })
    return true
  },
  gymDefend: (poiId, uid) => {
    const poi = _state.pois.find(p => p.id === poiId); const inst = _state.collection[uid]
    if (!poi || poi.kind !== 'gym' || !inst) return false
    const gym = poi.gym || { team: _state.profile.team, defenders: [] }
    if (gym.team && gym.team !== _state.profile.team) return false
    if ((gym.defenders || []).length >= 6 || (gym.defenders || []).includes(uid)) return false
    actions.updatePoi(poiId, { gym: { ...gym, team: _state.profile.team, owner: _state.profile.name, defenders: [...(gym.defenders || []), uid], points: (gym.points || 0) + inst.cp } })
    return true
  },
  feedDefender: (poiId, uid, berryId = 'razz') => {
    if (!actions.consumeItem(berryId)) return false
    actions.updateInstance(uid, {}) // touch
    _setState(s => ({ pois: s.pois.map(p => p.id === poiId ? { ...p, gym: { ...(p.gym || {}), fedAt: Date.now(), fedUid: uid } } : p) }))
    actions.addXp(25)
    return true
  },
  claimGymCoins: (poiId) => {
    const g = _state.gymCoinsToday; const sameDay = g.date === today()
    const canEarn = sameDay ? Math.max(0, 50 - g.earned) : 50
    if (canEarn <= 0) return 0
    actions.addCoins(canEarn)
    _setState({ gymCoinsToday: { date: today(), earned: (sameDay ? g.earned : 0) + canEarn } })
    return canEarn
  },

  // ----- walking / eggs / buddy -----
  addDistance: (meters) => {
    if (!meters || meters <= 0) return []
    _setState(s => {
      const weekly = s.weekly.week === weekId() ? s.weekly : { week: weekId(), distance: 0, claimed: [] }
      return { profile: { ...s.profile, distance: s.profile.distance + meters }, weekly: { ...weekly, distance: weekly.distance + meters } }
    })
    // eggs
    const hatched = []
    const speedOf = (egg) => { const inc = _state.incubators.find(i => i.id === egg.incubatorId); return inc?.type?.includes('Turbo') ? 1.5 : 1 }
    _setState(s => ({ eggs: s.eggs.map(e => e.incubatorId ? { ...e, walkedM: (e.walkedM || 0) + meters * speedOf(e) } : e) }))
    for (const egg of [..._state.eggs]) {
      if (egg.incubatorId && (egg.walkedM || 0) >= egg.distanceM) {
        const inst = actions.hatchEgg(egg.id)
        if (inst) hatched.push(inst)
      }
    }
    // buddy candy
    if (_state.buddy) {
      const inst = _state.collection[_state.buddy.uid]; const track = inst ? TRACK_BY_ID[inst.trackId] : null
      if (track) {
        const progress = (_state.buddy.candyProgressM || 0) + meters
        const goal = track.buddyKm * 1000
        if (progress >= goal) {
          _setState(s => ({ buddy: { ...s.buddy, candyProgressM: progress - goal, candyFound: (s.buddy.candyFound || 0) + 1 }, candy: { ...s.candy, [track.id]: (s.candy[track.id] || 0) + 1, ...(track.mega ? { } : {}) }, megaEnergy: track.mega ? { ...s.megaEnergy, [track.id]: (s.megaEnergy[track.id] || 0) + 5 } : s.megaEnergy }))
          actions.addBuddyHearts(1, 'walk')
        } else _setState(s => ({ buddy: { ...s.buddy, candyProgressM: progress } }))
      }
    }
    // route progress
    if (_state.routeState.activeId) actions.progressRoute(meters)
    return hatched
  },
  addEgg: (typeId = null) => {
    const types = [{ id: '2km', distanceM: 2000 }, { id: '5km', distanceM: 5000 }, { id: '7km', distanceM: 7000 }, { id: '10km', distanceM: 10000 }, { id: '12km', distanceM: 12000 }]
    const type = types.find(t => t.id === typeId) || types[Math.floor(Math.random() * 3)]
    const poolByKm = { 2000: [1, 2, 7, 9, 29, 32, 33, 38, 42], 5000: [5, 8, 10, 12, 14, 17, 19, 27, 28, 39, 41, 43], 7000: [9, 19, 31, 36], 10000: [6, 11, 13, 15, 16, 18, 20, 21, 22, 23, 30, 34, 35, 37, 40, 45], 12000: [13, 23, 27, 34] }[type.distanceM]
    const egg = { id: uid('egg'), type: type.id, distanceM: type.distanceM, walkedM: 0, rewardTrackId: poolByKm[Math.floor(Math.random() * poolByKm.length)], incubatorId: null }
    _setState(s => ({ eggs: [...s.eggs, egg], eggsCollected: s.eggsCollected + 1 }))
    return egg
  },
  placeEgg: (eggId, incubatorId) => {
    const inc = _state.incubators.find(i => i.id === incubatorId); if (!inc || inc.uses <= 0) return false
    if (_state.eggs.some(e => e.incubatorId === incubatorId)) return false
    _setState(s => ({
      eggs: s.eggs.map(e => e.id === eggId ? { ...e, incubatorId } : e),
      incubators: s.incubators.map(i => i.id === incubatorId && i.uses < 999999 ? { ...i, uses: i.uses - 1 } : i),
    }))
    return true
  },
  hatchEgg: (eggId) => {
    const egg = _state.eggs.find(e => e.id === eggId); if (!egg) return null
    _setState(s => ({ eggs: s.eggs.filter(e => e.id !== eggId), hatched: s.hatched + 1, stats: { ...s.stats, hatches: s.stats.hatches + 1 } }))
    const inst = actions.grantTrack(egg.rewardTrackId, { source: 'egg' })
    actions.addXp(500); actions.addStardust(400); actions.addCoins(100)
    if (inst) _setState(s => ({ candy: { ...s.candy, [inst.trackId]: (s.candy[inst.trackId] || 0) + 10 } }))
    return inst
  },
  buyIncubator: (kind) => {
    const itemId = kind === 'super' ? 'superincubator' : 'incubator'
    if (!actions.consumeItem(itemId)) {
      const item = ITEM_BY_ID[itemId]; if (!actions.spendCoins(item.price)) return false
    }
    _setState(s => ({ incubators: [...s.incubators, { id: uid('inc'), type: kind === 'super' ? 'Turbo' : 'Basic', uses: kind === 'super' ? 3 : 999999, speed: kind === 'super' ? 1.5 : 1 }] }))
    return true
  },
  claimWeekly: (tierKm) => {
    const rewards = { 5: { coins: 200, xp: 200 }, 25: { coins: 500, xp: 500, item: 'incubator' }, 50: { coins: 1000, xp: 1000, item: 'superincubator' }, 100: { coins: 2500, xp: 2000, item: 'premium' } }
    const r = rewards[tierKm]; if (!r) return false
    if (_state.weekly.distance < tierKm * 1000 || _state.weekly.claimed.includes(tierKm)) return false
    _setState(s => ({ weekly: { ...s.weekly, claimed: [...s.weekly.claimed, tierKm] } }))
    applyReward(r); return true
  },

  // ----- buddy -----
  setBuddy: (uid) => _setState({ buddy: { uid, totalHearts: 0, heartsToday: 0, heartDay: today(), candyProgressM: 0, candyFound: 0 } }),
  clearBuddy: () => _setState({ buddy: null }),
  addBuddyHearts: (n = 1, kind = 'care') => {
    if (!_state.buddy) return
    _setState(s => {
      const b = s.buddy; const sameDay = b.heartDay === today()
      return { buddy: { ...b, heartDay: today(), heartsToday: sameDay ? b.heartsToday + n : n, totalHearts: b.totalHearts + n, [`last_${kind}`]: today() } }
    })
  },
  buddyLevel: () => {
    const h = _state.buddy?.totalHearts || 0
    if (h >= 300) return { level: 4, name: 'Best Buddy', next: null }
    if (h >= 150) return { level: 3, name: 'Ultra Buddy', next: 300 }
    if (h >= 70) return { level: 2, name: 'Great Buddy', next: 150 }
    if (h >= 1) return { level: 1, name: 'Good Buddy', next: 70 }
    return { level: 0, name: 'Buddy', next: 1 }
  },

  // ----- research -----
  addFieldTask: (task) => {
    if (_state.research.field.length >= 3) return false
    const inst = { uid: uid('task'), ...task, progressStart: statSnapshot(_state.stats, task.type, task) }
    _setState(s => ({ research: { ...s.research, field: [...s.research.field, inst] } }))
    return true
  },
  taskProgress: (task) => {
    const cur = statSnapshot(_state.stats, task.type, task)
    const start = task.progressStart ?? cur
    return Math.min(task.target, Math.max(0, cur - start))
  },
  claimFieldTask: (taskUid) => {
    const task = _state.research.field.find(t => t.uid === taskUid); if (!task) return false
    if (actions.taskProgress(task) < task.target) return false
    _setState(s => ({ research: { ...s.research, field: s.research.field.filter(t => t.uid !== taskUid) } }))
    applyReward(task.reward); return true
  },
  deleteFieldTask: (taskUid) => _setState(s => ({ research: { ...s.research, field: s.research.field.filter(t => t.uid !== taskUid) } })),
  initCampaign: (kind, campaign) => {
    // kind: special|timed|seasonal ; records snapshots for step 0
    const step = campaign.steps[0]
    const starts = (step.tasks || []).map(t => statSnapshot(_state.stats, t.type, t))
    _setState(s => ({ research: { ...s.research, [`${kind}Step`]: 0, [`${kind}Start`]: starts, [`${kind}Id`]: campaign.id } }))
  },
  campaignProgress: (kind, campaign) => {
    const stepIdx = _state.research[`${kind}Step`] || 0
    const step = campaign.steps[stepIdx]; if (!step) return { done: true, tasks: [] }
    const starts = _state.research[`${kind}Start`] || step.tasks.map(t => statSnapshot(_state.stats, t.type, t))
    return { done: false, stepIdx, tasks: step.tasks.map((t, i) => ({ ...t, progress: Math.min(t.target, Math.max(0, statSnapshot(_state.stats, t.type, t) - (starts[i] ?? 0))) })) }
  },
  claimCampaignStep: (kind, campaign) => {
    const prog = actions.campaignProgress(kind, campaign)
    if (prog.done || prog.tasks.some(t => t.progress < t.target)) return false
    const step = campaign.steps[prog.stepIdx]
    applyReward(step.reward)
    const next = prog.stepIdx + 1
    if (next >= campaign.steps.length) {
      _setState(s => ({ research: { ...s.research, [`${kind}Step`]: next, [`${kind}Done`]: true } }))
    } else {
      const starts = campaign.steps[next].tasks.map(t => statSnapshot(_state.stats, t.type, t))
      _setState(s => ({ research: { ...s.research, [`${kind}Step`]: next, [`${kind}Start`]: starts } }))
    }
    return true
  },

  // ----- battles / raids / rocket -----
  recordBattle: ({ win, kind = 'trainer', enemyName = '' }) => {
    _setState(s => ({ stats: { ...s.stats, battles: s.stats.battles + 1, battleWins: s.stats.battleWins + (win ? 1 : 0), gymBattles: s.stats.gymBattles + (kind === 'gym' ? 1 : 0), raidsWon: s.stats.raidsWon + (win && kind === 'raid' ? 1 : 0), rocketWins: s.stats.rocketWins + (win && kind === 'rocket' ? 1 : 0) }, profile: { ...s.profile, battlesWon: s.profile.battlesWon + (win ? 1 : 0) } }))
    if (win) { actions.addXp(kind === 'raid' ? 1000 : kind === 'rocket' ? 500 : 300); actions.addCoins(kind === 'raid' ? 500 : 200) }
  },
  recordLeague: (win) => _setState(s => ({ league: { ...s.league, wins: s.league.wins + (win ? 1 : 0), battles: s.league.battles + 1, rating: Math.max(100, s.league.rating + (win ? 24 : -18)) } })),
  addRaid: (raid) => _setState(s => ({ raids: [...s.raids, raid] })),
  removeRaid: (id) => _setState(s => ({ raids: s.raids.filter(r => r.id !== id) })),
  setRaids: (raids) => _setState({ raids }),

  // ----- friends / gifts / trading / party -----
  addFriend: (friend) => {
    if (_state.friends.some(f => f.id === friend.id)) return false
    _setState(s => ({ friends: [...s.friends, { ...friend, friendXp: 0, giftSentDay: null, giftOpenedDay: null, lucky: false }] }))
    return true
  },
  removeFriend: (id) => _setState(s => ({ friends: s.friends.filter(f => f.id !== id) })),
  sendGift: (friendId) => {
    if (_state.giftsHeld <= 0) return false
    const f = _state.friends.find(x => x.id === friendId); if (!f || f.giftSentDay === today()) return false
    _setState(s => ({ giftsHeld: s.giftsHeld - 1, stats: { ...s.stats, giftsSent: s.stats.giftsSent + 1 }, friends: s.friends.map(x => x.id === friendId ? { ...x, giftSentDay: today(), friendXp: x.friendXp + 25 } : x) }))
    actions.addXp(100); return true
  },
  openGift: (friendId) => {
    const f = _state.friends.find(x => x.id === friendId); if (!f || f.giftOpenedDay?.startsWith?.(today())) return false
    // simulate receiving: friend must have "sent" — NPCs send daily automatically
    _setState(s => ({ stats: { ...s.stats, giftsOpened: s.stats.giftsOpened + 1 }, friends: s.friends.map(x => x.id === friendId ? { ...x, giftOpenedDay: today(), friendXp: x.friendXp + 25 } : x), giftsHeld: s.giftsHeld + 0 }))
    const loot = ['disc', 'razz', 'potion'][Math.floor(Math.random() * 3)]
    actions.addItem(loot, 3); actions.addXp(200); actions.addStardust(100)
    if (Math.random() < 0.2) actions.addEgg('7km')
    actions.addPostcard({ region: ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'][Math.floor(Math.random() * 9)], name: f.name, source: f.name })
    return true
  },
  trade: (friendId, myUid) => {
    const friend = _state.friends.find(f => f.id === friendId); const mine = _state.collection[myUid]
    if (!friend || !mine) return { ok: false, reason: 'Select a friend and one of your tracks.' }
    const stage = friendStage(friend.friendXp)
    const special = TRACK_BY_ID[mine.trackId].rarity === 'legendary' || mine.shiny
    if (special && _state.daily.specialTradeUsed && _state.daily.date === today()) return { ok: false, reason: 'Special trade already used today.' }
    const cost = special ? Math.max(100, 1000 - stage * 200) : Math.max(10, 100 - stage * 15)
    if ((_state.profile.stardust || 0) < cost) return { ok: false, reason: `Need ${cost} stardust.` }
    actions.spendStardust(cost)
    const pool = TRACKS.filter(t => t.rarity !== 'legendary')
    const received = pool[Math.floor(Math.random() * pool.length)]
    const col = { ..._state.collection }; delete col[myUid]
    const inst = makeInstance(received.id, { source: 'trade', lucky: Math.random() < 0.15 })
    _setState(s => ({
      collection: { ...col, [inst.uid]: inst },
      stats: { ...s.stats, trades: s.stats.trades + 1 },
      daily: { ...s.daily, specialTradeUsed: special ? true : s.daily.specialTradeUsed },
      friends: s.friends.map(x => x.id === friendId ? { ...x, friendXp: x.friendXp + 50 } : x),
      tradeLog: [{ id: uid('trade'), date: Date.now(), friend: friend.name, gave: mine.trackId, got: received.id }, ...s.tradeLog].slice(0, 20),
      candy: { ...s.candy, [mine.trackId]: (s.candy[mine.trackId] || 0) + 1, [received.id]: (s.candy[received.id] || 0) + 1 },
    }))
    registerDex(received.id, { caught: true })
    actions.addXp(200)
    return { ok: true, received: inst, cost }
  },
  createParty: () => {
    const challenges = [
      { id: 'pc1', text: 'Party: catch 10 tracks together', type: 'catches', target: 10 },
      { id: 'pc2', text: 'Party: walk 3 km together', type: 'walk', target: 3000 },
      { id: 'pc3', text: 'Party: win 3 battles together', type: 'battles', target: 3 },
    ].map(c => ({ ...c, start: statSnapshot(_state.stats, c.type, c), done: false }))
    _setState({ party: { code: Math.random().toString(36).slice(2, 6).toUpperCase(), members: [_state.profile.name, 'DJ Nova', 'BeatRider'], challenges, created: Date.now() } })
    return true
  },
  leaveParty: () => _setState({ party: null }),
  claimPartyChallenge: (id) => {
    const p = _state.party; if (!p) return false
    const c = p.challenges.find(x => x.id === id); if (!c || c.done) return false
    if (statSnapshot(_state.stats, c.type, c) - c.start < c.target) return false
    _setState(s => ({ party: { ...s.party, challenges: s.party.challenges.map(x => x.id === id ? { ...x, done: true } : x) } }))
    applyReward({ xp: 300, coins: 200 }); return true
  },

  // ----- routes / postcards / snapshots -----
  startRoute: (routeId) => _setState(s => ({ routeState: { ...s.routeState, activeId: routeId, waypoint: 0, walkedM: 0, lastEvent: 'Route started!' } })),
  stopRoute: () => _setState(s => ({ routeState: { ...s.routeState, activeId: null, lastEvent: null } })),
  progressRoute: (meters) => {
    const rs = _state.routeState; const route = ROUTES.find(r => r.id === rs.activeId); if (!route) return
    const walked = rs.walkedM + meters
    const perWaypoint = route.distanceM / route.waypoints.length
    let waypoint = rs.waypoint, cells = rs.cells, lastEvent = rs.lastEvent
    while (walked >= (waypoint + 1) * perWaypoint && waypoint < route.waypoints.length) {
      waypoint++
      if (Math.random() < 0.6) { cells++; lastEvent = `Crescendo Cell found at ${route.waypoints[waypoint - 1]}! (${cells})` }
      else lastEvent = `Reached ${route.waypoints[waypoint - 1]}!`
    }
    if (walked >= route.distanceM) {
      applyReward(route.reward)
      _setState(s => ({ routeState: { activeId: null, waypoint: 0, walkedM: 0, cells: s.routeState.cells, completed: [...new Set([...s.routeState.completed, route.id])], lastEvent: `Route complete! Rewards claimed.` }, stats: { ...s.stats, routesCompleted: s.stats.routesCompleted + 1 } }))
    } else {
      _setState(s => ({ routeState: { ...s.routeState, walkedM: walked, waypoint, cells, lastEvent } }))
    }
  },
  addPostcard: (pc) => _setState(s => ({ postcards: [{ id: uid('pc'), date: Date.now(), pinned: false, ...pc }, ...s.postcards].slice(0, 60) })),
  pinPostcard: (id) => _setState(s => ({ postcards: s.postcards.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p) })),
  takeSnapshot: (uidArg) => {
    const inst = _state.collection[uidArg]; if (!inst) return null
    const scenes = ['🌆 city skyline', '🌳 park', '🏖️ beach', '🎡 festival', '🌉 bridge', '☕ café']
    const snap = { id: uid('snap'), uid: uidArg, trackId: inst.trackId, scene: scenes[Math.floor(Math.random() * scenes.length)], date: Date.now(), photobomb: Math.random() < 0.25 }
    _setState(s => ({ snapshots: [snap, ...s.snapshots].slice(0, 30), stats: { ...s.stats, snapshots: s.stats.snapshots + 1 } }))
    actions.addBuddyHearts(1, 'photo')
    actions.addXp(25)
    return snap
  },
  claimDailyFree: () => {
    if (_state.daily.date === today() && _state.daily.freeClaimed) return false
    _setState(s => ({ daily: { ...s.daily, date: today(), freeClaimed: true } }))
    actions.addItem('disc', 5); actions.addItem('razz', 2); actions.addCoins(100)
    return true
  },
  claimOnce: (key, reward = {}) => {
    if (_state.eventClaims[key]) return false
    _setState(s => ({ eventClaims: { ...s.eventClaims, [key]: true } }))
    applyReward(reward); return true
  },
  claimCellReward: () => {
    if ((_state.routeState.cells || 0) < 20) return null
    _setState(s => ({ routeState: { ...s.routeState, cells: s.routeState.cells - 20 } }))
    return actions.grantTrack(CELL_TRACK_ID, { source: 'route' })
  },
  claimEventFree: (eventId) => {
    const key = `${eventId}-${today()}`
    if (_state.eventClaims[key]) return false
    _setState(s => ({ eventClaims: { ...s.eventClaims, [key]: true } }))
    actions.addItem('incense', 1); actions.addItem('luckyegg', 1)
    return true
  },
}

function useStore(selector) {
  const sel = selector || (s => s)
  const cacheRef = useState(() => ({ sel: null, state: undefined, slice: undefined }))[0]
  cacheRef.sel = sel
  const getSlice = useCallback(() => {
    if (cacheRef.state !== _state) { cacheRef.state = _state; cacheRef.slice = cacheRef.sel(getMergedState()) }
    return cacheRef.slice
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return useSyncExternalStore(subscribe, getSlice, getSlice)
}
useStore.getState = getState
useStore.setState = _setState
useStore.subscribe = subscribe

export { useStore }
export function xpForLevel(lvl) { return XP_PER_LEVEL(lvl) }
export function xpToNext(profile) {
  const next = XP_PER_LEVEL(profile.level + 1); const cur = XP_PER_LEVEL(profile.level)
  return { current: profile.xp - cur, needed: next - cur, next }
}
// re-export for screens
export { SHADOW_POOL, friendStage }
