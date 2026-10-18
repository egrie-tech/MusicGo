// YouTube playback support.
//  - resolveVideoId(track): finds the track's video on YouTube. The official
//    Data API needs a key, so search goes through public Piped / Invidious
//    API instances (open-source YouTube frontends that return JSON).
//    Public instances come and go constantly, so instead of trusting one
//    static list we (a) discover currently-live instances from the projects'
//    instance registries, (b) race many endpoints in parallel and take the
//    first hit, and (c) give the whole search one shared deadline instead
//    of a per-instance timeout multiplied by the number of dead hosts.
//    Results are cached.
//  - The actual playback uses the official YouTube IFrame Player API, so
//    audio/video come straight from YouTube. Everything fails soft: callers
//    fall back to the built-in synth player when no match is found.

// Static fallbacks, used until/unless live discovery succeeds.
const PIPED_STATIC = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi-libre.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.reallyaweso.me',
  'https://api.piped.private.coffee',
  'https://pipedapi.leptons.xyz',
]
const INVIDIOUS_STATIC = [
  'https://inv.nadeko.net',
  'https://yewtu.be',
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks',
]
const CACHE_KEY = 'musicgo-yt-cache-v2'
const SEARCH_DEADLINE_MS = 9000

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch (e) { return {} }
}
function writeCache(map) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(map)) } catch (e) { /* full/blocked */ }
}
export function trackQuery(track) {
  return track.youtubeQuery || `${track.title} ${track.artist} official audio`
}
function extractId(item) {
  if (!item) return null
  const url = item.url || item.webpage_url || ''
  const m = String(url).match(/[?&]v=([\w-]{6,})/) || String(url).match(/youtu\.be\/([\w-]{6,})/)
  if (m) return m[1]
  if (item.videoId && /^[\w-]{6,}$/.test(item.videoId)) return item.videoId
  if (item.id && /^[\w-]{6,}$/.test(item.id) && item.type !== 'channel') return item.id
  return null
}

async function fetchJson(url, timeoutMs, signal) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  const onAbort = () => ctrl.abort()
  if (signal) signal.addEventListener('abort', onAbort, { once: true })
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } })
    if (!res.ok) return null
    return await res.json()
  } catch (e) { return null } finally {
    clearTimeout(t)
    if (signal) signal.removeEventListener('abort', onAbort)
  }
}

// ---- live instance discovery (best effort, cached for the session) ----
let endpointsPromise = null
function discoverEndpoints() {
  if (endpointsPromise) return endpointsPromise
  endpointsPromise = (async () => {
    const piped = []
    const invidious = []
    const [pipedList, invList] = await Promise.all([
      fetchJson('https://piped-instances.kavin.rocks/', 4000),
      fetchJson('https://api.invidious.io/instances.json', 4000),
    ])
    if (Array.isArray(pipedList)) {
      pipedList
        .filter(i => i && i.api_url)
        .sort((a, b) => (b.uptime_24h || 0) - (a.uptime_24h || 0))
        .slice(0, 8)
        .forEach(i => piped.push(String(i.api_url).replace(/\/$/, '')))
    }
    if (Array.isArray(invList)) {
      invList
        .map(pair => (Array.isArray(pair) ? pair[1] : null))
        .filter(d => d && d.api && d.cors && d.uri && (d.type === 'https' || !d.type))
        .slice(0, 8)
        .forEach(d => invidious.push(String(d.uri).replace(/\/$/, '')))
    }
    const dedup = (arr) => [...new Set(arr)]
    return {
      piped: dedup([...piped, ...PIPED_STATIC]),
      invidious: dedup([...invidious, ...INVIDIOUS_STATIC]),
    }
  })().catch(() => ({ piped: PIPED_STATIC, invidious: INVIDIOUS_STATIC }))
  // If the registries were unreachable and we fell back to statics only,
  // don't cache that for the whole session — retry discovery next search.
  endpointsPromise.then((r) => {
    if (r.piped.length <= PIPED_STATIC.length && r.invidious.length <= INVIDIOUS_STATIC.length) endpointsPromise = null
  }).catch(() => { endpointsPromise = null })
  return endpointsPromise
}

async function searchPiped(base, query, signal) {
  const json = await fetchJson(`${base}/search?q=${encodeURIComponent(query)}&filter=music_songs`, SEARCH_DEADLINE_MS, signal)
  const items = (json && (json.items || json.results)) || []
  for (const item of items) {
    const id = extractId(item)
    if (id) return id
  }
  return null
}
async function searchInvidious(base, query, signal) {
  const json = await fetchJson(`${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, SEARCH_DEADLINE_MS, signal)
  const items = Array.isArray(json) ? json : (json && json.items) || []
  for (const item of items) {
    const id = extractId(item)
    if (id) return id
  }
  return null
}

// Race every task; resolve with the first non-null result (or null when all
// fail / the deadline passes). Losers are aborted via the shared signal.
function firstHit(tasks, deadlineMs, outerSignal = null) {
  return new Promise((resolve) => {
    const ctrl = new AbortController()
    let pending = tasks.length
    let done = false
    const finish = (val) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try { ctrl.abort() } catch (e) { /* noop */ }
      resolve(val)
    }
    const timer = setTimeout(() => finish(null), deadlineMs)
    if (outerSignal) {
      if (outerSignal.aborted) { finish(null); return }
      outerSignal.addEventListener('abort', () => finish(null), { once: true })
    }
    if (!pending) { finish(null); return }
    tasks.forEach((make) => {
      Promise.resolve()
        .then(() => make(ctrl.signal))
        .then((v) => { if (v) finish(v); else if (--pending === 0) finish(null) })
        .catch(() => { if (--pending === 0) finish(null) })
    })
  })
}

async function searchAll(query, limitPerKind = 8, deadlineMs = SEARCH_DEADLINE_MS) {
  // static endpoints race immediately; live-discovered instances join the
  // race as soon as the registries answer, all under one shared deadline
  const tasks = [
    ...PIPED_STATIC.map(base => (sig) => searchPiped(base, query, sig)),
    ...INVIDIOUS_STATIC.map(base => (sig) => searchInvidious(base, query, sig)),
    async (sig) => {
      const { piped, invidious } = await discoverEndpoints()
      const fresh = [
        ...piped.filter(b => !PIPED_STATIC.includes(b)).slice(0, limitPerKind).map(base => (s2) => searchPiped(base, query, s2)),
        ...invidious.filter(b => !INVIDIOUS_STATIC.includes(b)).slice(0, limitPerKind).map(base => (s2) => searchInvidious(base, query, s2)),
      ]
      return fresh.length ? firstHit(fresh, deadlineMs, sig) : null
    },
  ]
  return firstHit(tasks, deadlineMs)
}

export async function resolveVideoId(track) {
  if (!track) return null
  if (track.youtubeId) return track.youtubeId
  const query = trackQuery(track)
  const cache = readCache()
  if (cache[query]) return cache[query]
  const started = Date.now()
  let id = await searchAll(query)
  if (!id && Date.now() - started < 6000) {
    // looser second attempt (title only) — skipped if the first pass already
    // burned most of the time budget hanging on dead instances, so the UI
    // never sits on "searching…" for two full deadlines in a row
    const loose = `${track.title} song`
    if (loose !== query) id = await searchAll(loose, 5, 5000)
  }
  if (id) { cache[query] = id; writeCache(cache) }
  return id
}
export function clearYouTubeCache() { try { localStorage.removeItem(CACHE_KEY) } catch (e) { /* noop */ } }

// ---------------- IFrame Player API ----------------
let apiPromise = null
let ytPlayer = null
let cb = { onEnded: null, onReady: null, onError: null }
let playerGen = 0 // bumped by ytDestroy so an in-flight creation can't resurrect a player

export function loadYouTubeApi() {
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return }
    let settled = false
    const done = (v) => { if (!settled) { settled = true; resolve(v || null) } }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); done(window.YT) }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    tag.onerror = () => { apiPromise = null; done(null) } // allow a later retry
    document.head.appendChild(tag)
    // never hang forever (blocked script, offline…): resolve null and let
    // the caller fall back / retry on the next tap
    setTimeout(() => { if (window.YT && window.YT.Player) done(window.YT); else { apiPromise = null; done(null) } }, 8000)
  })
  return apiPromise
}

let creatingPromise = null
export async function createYtPlayer(elementId, videoId, callbacks = {}) {
  cb = { ...cb, ...callbacks }
  if (ytPlayer) {
    // player already exists (created early, inside the user's tap) — just load
    if (videoId) { try { ytPlayer.loadVideoById(videoId) } catch (e) { /* not ready yet; YT queues calls */ } }
    return ytPlayer
  }
  if (creatingPromise) {
    const existing = await creatingPromise
    if (existing && videoId) { try { existing.loadVideoById(videoId) } catch (e) { /* not ready yet */ } }
    return existing
  }
  const gen = playerGen
  creatingPromise = (async () => {
    const YT = await loadYouTubeApi()
    if (gen !== playerGen) return null // destroyed while we were loading
    if (!YT || !YT.Player) {
      creatingPromise = null // don't cache a failure — next tap retries
      cb.onError && cb.onError('api-unavailable')
      return null
    }
    if (ytPlayer) { // created by a racing call meanwhile
      if (videoId) { try { ytPlayer.loadVideoById(videoId) } catch (e) { /* not ready yet */ } }
      return ytPlayer
    }
    const config = {
      width: '100%', height: '100%',
      playerVars: {
        autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1,
        ...(typeof window !== 'undefined' && window.location && window.location.origin
          ? { origin: window.location.origin, widget_referrer: window.location.href } : {}),
      },
      events: {
        onReady: (e) => {
          // make sure the iframe is allowed to autoplay, then start playback
          try { e.target.getIframe().setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen') } catch (err) { /* noop */ }
          cb.onReady && cb.onReady(e)
        },
        onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED && cb.onEnded) cb.onEnded() },
        onError: (e) => { cb.onError && cb.onError(e?.data || 'player-error') },
      },
    }
    if (videoId) config.videoId = videoId
    ytPlayer = new YT.Player(elementId, config)
    return ytPlayer
  })()
  return creatingPromise
}
export function ytLoadVideo(videoId) { try { ytPlayer && ytPlayer.loadVideoById(videoId) } catch (e) { /* not ready */ } }
export function ytPlay() { try { ytPlayer && ytPlayer.playVideo() } catch (e) { /* noop */ } }
export function ytPause() { try { ytPlayer && ytPlayer.pauseVideo() } catch (e) { /* noop */ } }
export function ytSeekTo(sec) { try { ytPlayer && ytPlayer.seekTo(Math.max(0, sec), true) } catch (e) { /* noop */ } }
export function ytSetVolume(v) { try { ytPlayer && ytPlayer.setVolume(Math.round(Math.min(1, Math.max(0, v)) * 100)) } catch (e) { /* noop */ } }
export function ytGetTime() { try { const t = ytPlayer && ytPlayer.getCurrentTime(); return typeof t === 'number' ? t : null } catch (e) { return null } }
export function ytGetDuration() { try { const d = ytPlayer && ytPlayer.getDuration(); return typeof d === 'number' && d > 0 ? d : null } catch (e) { return null } }
export function ytDestroy() {
  playerGen++
  try { ytPlayer && ytPlayer.destroy() } catch (e) { /* noop */ }
  ytPlayer = null
  creatingPromise = null
}
