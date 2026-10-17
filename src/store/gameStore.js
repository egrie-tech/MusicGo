import { useSyncExternalStore, useCallback, useState } from 'react'
import { TRACKS, RARITY } from '../data/tracks'
import { ITEMS } from '../data/items'
import { EVOLUTIONS, getEvolution } from '../data/evolutions'
import { randomWeather, TEAMS } from '../data/types'

const STORAGE_KEY = 'musicgo-store-v2'
const XP_PER_LEVEL = (lvl) => 100 * lvl * (lvl + 1) / 2

const initialState = {
  profile: { name: 'Player', level: 1, xp: 0, coins: 500, avatar: '🎧', title: 'Rookie Listener', caught: 0, battlesWon: 0, distance: 0, streak: 1, team: null, stardust: 0, lastLogin: Date.now(), dailyStreak: 1 },
  collection: {},   // trackId -> { count, caughtAt, hp, level, cp, candy, favorite, tags:[], shiny, buddy }
  candy: {},        // species trackId -> candy count
  inventory: { ball: 10, great: 2, ultra: 1, potion: 3, lure: 1, incense: 1, revive: 1, radar: 1, berry: 5, incubator: 2, raidpass: 1 },
  effects: { incenseUntil: 0, lureVenues: {}, weather: null },
  weather: randomWeather(),
  drops: [],
  venues: {},
  battle: null,
  eggs: [],         // { id, type, distanceNeeded, distanceWalked, incubator }
  incubators: [ { id: 'inc-1', type: 'basic', uses: 3 }, { id: 'inc-2', type: 'super', uses: 999 } ],
  buddy: null,      // trackId
  buddyHearts: 0,
  buddyCandy: 0,
  research: [],     // active research tasks
  raids: [],        // active raids at venues
  friends: [],
  gifts: [],
  eggsCollected: 0,
  hatched: 0,
  settings: { sound: true, music: true, units: 'metric' },
  favorites: [],
  tags: {},
  daily: { date: new Date().toDateString(), claimed: false, streak: 1 },
  routes: [],
  postcards: [],
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const s = (parsed && parsed.state) ? parsed.state : parsed
      if (s && typeof s === 'object') {
        const clean = {}
        for (const k in s) { if (s[k] !== undefined) clean[k] = s[k] }
        const merged = { ...initialState, ...clean }
        if (!merged.profile || typeof merged.profile !== 'object') merged.profile = { ...initialState.profile }
        else merged.profile = { ...initialState.profile, ...merged.profile }
        if (!Array.isArray(merged.drops)) merged.drops = []
        if (!merged.collection || typeof merged.collection !== 'object') merged.collection = {}
        if (!merged.inventory || typeof merged.inventory !== 'object') merged.inventory = { ...initialState.inventory }
        if (!merged.venues || typeof merged.venues !== 'object') merged.venues = {}
        if (!merged.candy || typeof merged.candy !== 'object') merged.candy = {}
        if (!Array.isArray(merged.eggs)) merged.eggs = []
        if (!Array.isArray(merged.incubators)) merged.incubators = [...initialState.incubators]
        if (!Array.isArray(merged.research)) merged.research = []
        if (!Array.isArray(merged.raids)) merged.raids = []
        if (!Array.isArray(merged.friends)) merged.friends = []
        if (!Array.isArray(merged.routes)) merged.routes = []
        if (!merged.weather) merged.weather = randomWeather()
        return merged
      }
    }
  } catch (e) {}
  return { ...initialState }
}

let _state = loadPersisted()
const listeners = new Set()

function _setState(partial) {
  const next = typeof partial === 'function' ? partial(_state) : partial
  _state = { ..._state, ...next }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: _state })) } catch (e) {}
  listeners.forEach(l => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getMergedState() {
  return { ..._state, drops: Array.isArray(_state.drops) ? _state.drops : [], collection: _state.collection || {}, inventory: _state.inventory || {}, venues: _state.venues || {}, profile: _state.profile || initialState.profile, candy: _state.candy || {}, eggs: _state.eggs || [], ...actions }
}

function getState() { return getMergedState() }

const actions = {
  setName: (name) => _setState(s => ({ profile: { ...s.profile, name } })),
  setAvatar: (avatar) => _setState(s => ({ profile: { ...s.profile, avatar } })),
  setTeam: (team) => _setState(s => ({ profile: { ...s.profile, team } })),
  addXp: (amount) => _setState(s => {
    let xp = s.profile.xp + amount
    let level = s.profile.level
    while (xp >= XP_PER_LEVEL(level + 1)) { level++ }
    const titles = ['Rookie Listener','Street Listener','Beat Seeker','Groove Walker','Stage Regular','Headliner','Legend','Icon','Maestro','MusicGo Champion']
    const title = titles[Math.min(titles.length - 1, Math.floor((level - 1) / 3))]
    return { profile: { ...s.profile, xp, level, title } }
  }),
  addCoins: (amount) => _setState(s => ({ profile: { ...s.profile, coins: s.profile.coins + amount } })),
  addStardust: (amount) => _setState(s => ({ profile: { ...s.profile, stardust: (s.profile.stardust || 0) + amount } })),
  spendCoins: (amount) => {
    if (_state.profile.coins < amount) return false
    _setState(s => ({ profile: { ...s.profile, coins: s.profile.coins - amount } }))
    return true
  },
  spendStardust: (amount) => {
    if ((_state.profile.stardust || 0) < amount) return false
    _setState(s => ({ profile: { ...s.profile, stardust: s.profile.stardust - amount } }))
    return true
  },
  addDistance: (m) => _setState(s => ({ profile: { ...s.profile, distance: s.profile.distance + m } })),
  catchTrack: (trackId, itemMult = 1, isShiny = false) => {
    const track = TRACKS.find(t => t.id === trackId)
    if (!track) return { ok: false }
    const base = track.stats.catchRate * itemMult
    const roll = Math.random()
    const success = roll < base
    if (!success) {
      // fleeing chance
      if (Math.random() < 0.15) return { ok: false, success: false, fled: true, roll, base }
      return { ok: false, success: false, fled: false, roll, base }
    }
    const existing = _state.collection[trackId]
    const now = Date.now()
    const candyGain = track.candyReward || 3
    const entry = existing
      ? { ...existing, count: existing.count + 1, caughtAt: now, best: Math.max(existing.best || 0, Math.round(base * 100)), shiny: existing.shiny || isShiny }
      : { count: 1, caughtAt: now, hp: track.stats.hp, level: 1, cp: track.stats.cp, best: Math.round(base * 100), candy: 0, favorite: false, tags: [], shiny: isShiny }
    _setState(s => ({
      collection: { ...s.collection, [trackId]: entry },
      profile: { ...s.profile, caught: s.profile.caught + (existing ? 0 : 1) },
      candy: { ...s.candy, [trackId]: (s.candy[trackId] || 0) + candyGain },
    }))
    actions.addXp(track.xp)
    actions.addCoins(Math.round(track.xp / 2))
    actions.addStardust(Math.round(track.xp / 4))
    return { ok: true, success: true, track, xp: track.xp, coins: Math.round(track.xp / 2), candy: candyGain, shiny: isShiny }
  },
  hasTrack: (trackId) => !!_state.collection[trackId],
  collectionCount: () => Object.keys(_state.collection).length,
  collectionTotal: () => TRACKS.length,
  addItem: (itemId, qty = 1) => _setState(s => ({
    inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] || 0) + qty }
  })),
  consumeItem: (itemId) => {
    if ((_state.inventory[itemId] || 0) <= 0) return false
    _setState(s => ({ inventory: { ...s.inventory, [itemId]: s.inventory[itemId] - 1 } }))
    return true
  },
  buyItem: (itemId, qty = 1) => {
    const item = ITEMS.find(i => i.id === itemId)
    if (!item) return false
    const cost = item.price * qty
    if (!actions.spendCoins(cost)) return false
    actions.addItem(itemId, qty)
    return true
  },
  setDrops: (drops) => _setState({ drops: Array.isArray(drops) ? drops : [] }),
  addDrop: (drop) => _setState(s => ({ drops: [...(s.drops || []), drop] })),
  removeDrop: (id) => _setState(s => ({ drops: (s.drops || []).filter(d => d.id !== id) })),
  markCaught: (id) => _setState(s => ({ drops: (s.drops || []).map(d => d.id === id ? { ...d, caught: true } : d) })),
  claimVenue: (venueId, team) => _setState(s => ({
    venues: { ...s.venues, [venueId]: { owner: s.profile.name, team, level: 1, claimedAt: Date.now() } }
  })),
  startBattle: (enemyTeam, venueId = null) => _setState({
    battle: { enemyTeam, venueId, playerHp: {}, enemyHp: {}, turn: 'player', log: [], status: 'active', selectedTrack: null, shields: { player: 2, enemy: 2 } }
  }),
  setBattle: (b) => _setState({ battle: b }),
  endBattle: (result) => {
    if (result === 'win') {
      actions.addXp(100)
      actions.addCoins(200)
      _setState(s => ({ profile: { ...s.profile, battlesWon: s.profile.battlesWon + 1 } }))
    }
    _setState({ battle: null })
  },
  reset: () => _setState(initialState),

  // ---- Eggs ----
  addEgg: (egg) => _setState(s => ({ eggs: [...(s.eggs || []), egg], eggsCollected: (s.eggsCollected || 0) + 1 })),
  placeEgg: (eggId, incubatorId) => _setState(s => ({
    eggs: (s.eggs || []).map(e => e.id === eggId ? { ...e, incubator: incubatorId } : e),
    incubators: (s.incubators || []).map(i => i.id === incubatorId ? { ...i, uses: Math.max(0, i.uses - 1) } : i),
  })),
  hatchEgg: (eggId, trackId) => {
    const egg = (_state.eggs || []).find(e => e.id === eggId)
    _setState(s => ({ eggs: (s.eggs || []).filter(e => e.id !== eggId), hatched: (s.hatched || 0) + 1 }))
    if (trackId) actions.catchTrack(trackId, 1)
    actions.addXp(500)
    actions.addCoins(300)
    actions.addStardust(200)
  },
  walkEggs: (meters) => {
    const km = meters / 1000
    _setState(s => {
      const eggs = (s.eggs || []).map(e => {
        if (!e.incubator) return e
        const walked = (e.distanceWalked || 0) + meters
        return { ...e, distanceWalked: walked }
      })
      return { eggs }
    })
    // hatch ready eggs
    const ready = (_state.eggs || []).filter(e => e.incubator && (e.distanceWalked || 0) >= (e.distanceNeeded || 2000))
    ready.forEach(e => {
      const trackId = e.rewardTrackId || null
      actions.hatchEgg(e.id, trackId)
    })
  },

  // ---- Buddy ----
  setBuddy: (trackId) => _setState({ buddy: trackId, buddyHearts: 0, buddyCandy: 0 }),
  clearBuddy: () => _setState({ buddy: null, buddyHearts: 0, buddyCandy: 0 }),
  addBuddyHeart: () => _setState(s => ({ buddyHearts: (s.buddyHearts || 0) + 1 })),
  addBuddyCandy: (amount) => _setState(s => ({ buddyCandy: (s.buddyCandy || 0) + amount })),
  walkBuddy: (meters) => {
    const km = meters / 1000
    if (!_state.buddy) return
    const track = TRACKS.find(t => t.id === _state.buddy)
    const candy = Math.floor(km * (track?.buddyCandyPerKm || 1))
    if (candy > 0) {
      _setState(s => ({ buddyCandy: (s.buddyCandy || 0) + candy, candy: { ...s.candy, [_state.buddy]: (s.candy[_state.buddy] || 0) + candy } }))
    }
  },

  // ---- Evolution / Power up ----
  powerUp: (trackId) => {
    const entry = _state.collection[trackId]
    const track = TRACKS.find(t => t.id === trackId)
    if (!entry || !track) return false
    const cost = 1000 * entry.level
    const dustCost = 500 * entry.level
    if (_state.profile.coins < cost || (_state.profile.stardust || 0) < dustCost) return false
    actions.spendCoins(cost)
    actions.spendStardust(dustCost)
    _setState(s => ({
      collection: { ...s.collection, [trackId]: { ...entry, level: entry.level + 1, cp: track.stats.cp + 50 * (entry.level + 1), hp: track.stats.hp + 10 * (entry.level + 1) } }
    }))
    return true
  },
  evolve: (trackId) => {
    const evo = getEvolution(trackId)
    if (!evo) return { ok: false, reason: 'no-evolution' }
    const entry = _state.collection[trackId]
    if (!entry) return { ok: false, reason: 'not-caught' }
    const candyHave = _state.candy[trackId] || 0
    if (candyHave < evo.candy) return { ok: false, reason: 'not-enough-candy' }
    // consume candy
    _setState(s => ({ candy: { ...s.candy, [trackId]: (s.candy[trackId] || 0) - evo.candy } }))
    // catch the evolved form
    actions.catchTrack(evo.to, 10)
    return { ok: true, to: evo.to }
  },
  transfer: (trackId) => {
    const entry = _state.collection[trackId]
    if (!entry) return false
    const track = TRACKS.find(t => t.id === trackId)
    const candyGain = track?.candyReward || 3
    const newCol = { ..._state.collection }
    if (entry.count > 1) newCol[trackId] = { ...entry, count: entry.count - 1 }
    else delete newCol[trackId]
    _setState(s => ({
      collection: newCol,
      candy: { ...s.candy, [trackId]: (s.candy[trackId] || 0) + candyGain },
      profile: { ...s.profile, caught: Math.max(0, s.profile.caught - (entry.count <= 1 ? 1 : 0)) },
    }))
    actions.addStardust(100)
    return true
  },
  toggleFavorite: (trackId) => _setState(s => {
    const entry = s.collection[trackId]
    if (!entry) return {}
    return { collection: { ...s.collection, [trackId]: { ...entry, favorite: !entry.favorite } } }
  }),
  addTag: (trackId, tag) => _setState(s => {
    const entry = s.collection[trackId]
    if (!entry) return {}
    const tags = entry.tags || []
    if (tags.includes(tag)) return {}
    return { collection: { ...s.collection, [trackId]: { ...entry, tags: [...tags, tag] } } }
  }),

  // ---- Weather ----
  setWeather: (w) => _setState({ weather: w }),
  refreshWeather: () => _setState({ weather: randomWeather() }),

  // ---- Research ----
  addResearch: (task) => _setState(s => ({ research: [...(s.research || []), task] })),
  completeResearch: (id) => _setState(s => {
    const task = (s.research || []).find(r => r.id === id)
    if (task && task.reward) {
      // apply reward
      setTimeout(() => {
        if (task.reward.coins) actions.addCoins(task.reward.coins)
        if (task.reward.xp) actions.addXp(task.reward.xp)
        if (task.reward.stardust) actions.addStardust(task.reward.stardust)
        if (task.reward.item) actions.addItem(task.reward.item, task.reward.qty || 1)
        if (task.reward.trackId) actions.catchTrack(task.reward.trackId, 10)
      }, 0)
    }
    return { research: (s.research || []).filter(r => r.id !== id) }
  }),

  // ---- Raids ----
  addRaid: (raid) => _setState(s => ({ raids: [...(s.raids || []), raid] })),
  removeRaid: (id) => _setState(s => ({ raids: (s.raids || []).filter(r => r.id !== id) })),

  // ---- Friends ----
  addFriend: (name) => _setState(s => ({ friends: [...(s.friends || []), { name, level: 1, xp: 0, lastGift: 0 }] })),
  sendGift: (name) => _setState(s => ({
    friends: (s.friends || []).map(f => f.name === name ? { ...f, lastGift: Date.now() } : f),
    gifts: [...(s.gifts || []), { from: s.profile.name, to: name, date: Date.now() }]
  })),

  // ---- Daily ----
  claimDaily: () => {
    const today = new Date().toDateString()
    if (_state.daily?.date === today && _state.daily?.claimed) return false
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const streak = _state.daily?.date === yesterday ? (_state.daily.streak || 0) + 1 : 1
    _setState(s => ({ daily: { date: today, claimed: true, streak } }))
    actions.addCoins(100 * streak)
    actions.addXp(50 * streak)
    actions.addStardust(25 * streak)
    if (streak % 7 === 0) actions.addItem('incubator', 1)
    return true
  },

  // ---- Routes ----
  addRoute: (route) => _setState(s => ({ routes: [...(s.routes || []), route] })),

  // ---- Postcards ----
  addPostcard: (pc) => _setState(s => ({ postcards: [...(s.postcards || []), pc] })),
}

function useStore(selector) {
  const sel = selector || (s => s)
  const cacheRef = useState(() => ({ sel: null, state: undefined, slice: undefined }))[0]
  cacheRef.sel = sel
  const getSlice = useCallback(() => {
    if (cacheRef.state !== _state) {
      cacheRef.state = _state
      cacheRef.slice = cacheRef.sel(getMergedState())
    }
    return cacheRef.slice
  }, [])
  return useSyncExternalStore(subscribe, getSlice, getSlice)
}

useStore.getState = getState
useStore.setState = _setState
useStore.subscribe = subscribe

export { useStore }
export function xpForLevel(lvl) { return 100 * lvl * (lvl + 1) / 2 }
export function xpToNext(profile) {
  const next = XP_PER_LEVEL(profile.level + 1)
  const cur = XP_PER_LEVEL(profile.level)
  return { current: profile.xp - cur, needed: next - cur, next }
}
