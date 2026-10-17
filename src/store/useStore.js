import { useSyncExternalStore, useCallback, useRef } from 'react'
import { TRACKS, RARITY } from '../data/tracks'
import { ITEMS } from '../data/items'

const STORAGE_KEY = 'musicgo-store'
const XP_PER_LEVEL = (lvl) => 100 * lvl * (lvl + 1) / 2

const initialState = {
  profile: { name: 'Player', level: 1, xp: 0, coins: 500, avatar: '🎧', title: 'Rookie Listener', caught: 0, battlesWon: 0, distance: 0, streak: 1 },
  collection: {},
  inventory: { ball: 10, great: 2, ultra: 1, potion: 3, lure: 1, incense: 1, revive: 1, radar: 1 },
  effects: { incenseUntil: 0, lureVenues: {} },
  drops: [],
  venues: {},
  battle: null,
  settings: { sound: true, music: true, units: 'metric' },
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const s = (parsed && parsed.state) ? parsed.state : parsed
      if (s && typeof s === 'object') {
        const merged = { ...initialState, ...s }
        if (!merged.profile || typeof merged.profile !== 'object') merged.profile = { ...initialState.profile }
        else merged.profile = { ...initialState.profile, ...merged.profile }
        return merged
      }
    }
  } catch (e) {}
  return { ...initialState }
}

let _state = loadPersisted()
const listeners = new Set()

function _setState(partial) {
  _state = typeof partial === 'function' ? partial(_state) : { ..._state, ...partial }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: _state })) } catch (e) {}
  listeners.forEach(l => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getMergedState() {
  return { ..._state, ...actions }
}

function getState() {
  return getMergedState()
}

const actions = {
  setName: (name) => _setState(s => ({ profile: { ...s.profile, name } })),
  setAvatar: (avatar) => _setState(s => ({ profile: { ...s.profile, avatar } })),
  addXp: (amount) => _setState(s => {
    let xp = s.profile.xp + amount
    let level = s.profile.level
    while (xp >= XP_PER_LEVEL(level + 1)) { level++ }
    const titles = ['Rookie Listener','Street Listener','Beat Seeker','Groove Walker','Stage Regular','Headliner','Legend','Icon','Maestro','MusicGo Champion']
    const title = titles[Math.min(titles.length - 1, Math.floor((level - 1) / 3))]
    return { profile: { ...s.profile, xp, level, title } }
  }),
  addCoins: (amount) => _setState(s => ({ profile: { ...s.profile, coins: s.profile.coins + amount } })),
  spendCoins: (amount) => {
    if (_state.profile.coins < amount) return false
    _setState(s => ({ profile: { ...s.profile, coins: s.profile.coins - amount } }))
    return true
  },
  addDistance: (m) => _setState(s => ({ profile: { ...s.profile, distance: s.profile.distance + m } })),
  catchTrack: (trackId, itemMult = 1) => {
    const track = TRACKS.find(t => t.id === trackId)
    if (!track) return { ok: false }
    const base = track.stats.catchRate * itemMult
    const roll = Math.random()
    const success = roll < base
    if (!success) return { ok: false, success: false, roll, base }
    const existing = _state.collection[trackId]
    const now = Date.now()
    const entry = existing
      ? { ...existing, count: existing.count + 1, caughtAt: now, best: Math.max(existing.best || 0, Math.round(base * 100)) }
      : { count: 1, caughtAt: now, hp: 100, level: 1, best: Math.round(base * 100) }
    _setState(s => ({
      collection: { ...s.collection, [trackId]: entry },
      profile: { ...s.profile, caught: s.profile.caught + (existing ? 0 : 1) },
    }))
    actions.addXp(track.xp)
    actions.addCoins(Math.round(track.xp / 2))
    return { ok: true, success: true, track, xp: track.xp, coins: Math.round(track.xp / 2) }
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
  setDrops: (drops) => _setState({ drops }),
  addDrop: (drop) => _setState(s => ({ drops: [...s.drops, drop] })),
  removeDrop: (id) => _setState(s => ({ drops: s.drops.filter(d => d.id !== id) })),
  markCaught: (id) => _setState(s => ({ drops: s.drops.map(d => d.id === id ? { ...d, caught: true } : d) })),
  claimVenue: (venueId, team) => _setState(s => ({
    venues: { ...s.venues, [venueId]: { owner: s.profile.name, team, level: 1, claimedAt: Date.now() } }
  })),
  startBattle: (enemyTeam, venueId = null) => _setState({
    battle: { enemyTeam, venueId, playerHp: {}, enemyHp: {}, turn: 'player', log: [], status: 'active', selectedTrack: null }
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
}

// useStore hook with selector support
function useStore(selector) {
  const selRef = useRef(selector || (s => s))
  selRef.current = selector || (s => s)
  const lastStateRef = useRef(undefined)
  const lastSliceRef = useRef(undefined)
  const getSlice = useCallback(() => {
    if (lastStateRef.current !== _state) {
      lastStateRef.current = _state
      lastSliceRef.current = selRef.current(getMergedState())
    }
    return lastSliceRef.current
  }, [])
  return useSyncExternalStore(subscribe, getSlice, getSlice)
}

// attach getState
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
