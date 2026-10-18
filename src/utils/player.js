// Music player for caught tracks.
//
// Primary source: YouTube. Each track is resolved to a YouTube video
// (see utils/youtube.js) and played through the official IFrame player —
// those are the actual songs. If YouTube can't be reached or no match is
// found, playback falls back to the built-in procedural synth engine,
// which performs a deterministic arrangement per track with Web Audio.
import { useSyncExternalStore } from 'react'
import { TRACK_BY_ID } from '../data/tracks'
import { resolveVideoId, loadYouTubeApi, ytPlay, ytPause, ytSeekTo, ytSetVolume, ytGetTime, ytGetDuration, ytDestroy } from './youtube'

const GENRE_CFG = {
  Pop:        { bpm: 118, scale: 'major', wave: 'sawtooth', bassWave: 'triangle', drive: 0.8 },
  'Hip-Hop':  { bpm: 92,  scale: 'minor', wave: 'square',   bassWave: 'sine',     drive: 0.65 },
  Rock:       { bpm: 140, scale: 'minor', wave: 'square',   bassWave: 'sawtooth', drive: 1 },
  Electronic: { bpm: 126, scale: 'minor', wave: 'sawtooth', bassWave: 'sawtooth', drive: 0.9 },
  Jazz:       { bpm: 84,  scale: 'dorian', wave: 'sine',    bassWave: 'sine',     drive: 0.45 },
  Classical:  { bpm: 76,  scale: 'major', wave: 'triangle', bassWave: 'triangle', drive: 0.35 },
  Indie:      { bpm: 104, scale: 'major', wave: 'triangle', bassWave: 'triangle', drive: 0.55 },
  'R&B':      { bpm: 88,  scale: 'dorian', wave: 'sine',    bassWave: 'sine',     drive: 0.6 },
  Latin:      { bpm: 128, scale: 'major', wave: 'square',   bassWave: 'triangle', drive: 0.85 },
  'K-Pop':    { bpm: 124, scale: 'major', wave: 'sawtooth', bassWave: 'square',   drive: 0.9 },
}
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
}
const ROOTS = [45, 47, 48, 50, 52, 53, 55] // A2..G3 (MIDI)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const BARS = 32

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12)

export function compositionInfo(track) {
  if (!track) return null
  const cfg = GENRE_CFG[track.genre] || GENRE_CFG.Pop
  const bpm = cfg.bpm + ((track.id * 7) % 9) - 4
  const root = ROOTS[track.id % ROOTS.length]
  const stepDur = 60 / bpm / 4
  const duration = Math.round(BARS * 16 * stepDur)
  return { bpm, root, rootName: NOTE_NAMES[root % 12], scale: cfg.scale, duration, key: `${NOTE_NAMES[root % 12]} ${cfg.scale}` }
}

function buildComposition(track) {
  const info = compositionInfo(track)
  const cfg = GENRE_CFG[track.genre] || GENRE_CFG.Pop
  const scale = SCALES[info.scale]
  const rng = mulberry32(track.id * 1000 + 77)
  const progressions = info.scale === 'major'
    ? [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4]][track.id % 3]
    : [[0, 5, 2, 6], [0, 6, 5, 4], [0, 3, 5, 6]][track.id % 3]
  const chordRoot = (deg) => info.root + scale[deg % 7] + 12 * Math.floor(deg / 7)
  const totalSteps = BARS * 16
  const melody = new Array(totalSteps).fill(null)
  let idx = 4 + Math.floor(rng() * 4)
  for (let step = 0; step < totalSteps; step++) {
    const inBar = step % 16
    const density = track.genre === 'Jazz' || track.genre === 'Classical' ? 0.42 : 0.55
    const rhythmic = [0, 2, 4, 6, 8, 10, 12, 14].includes(inBar) || rng() < 0.25
    if (rhythmic && rng() < density) {
      idx = Math.max(0, Math.min(13, idx + [0, 0, 1, -1, 2, -2, 3][Math.floor(rng() * 7)]))
      melody[step] = info.root + 12 + scale[idx % 7] + 12 * Math.floor(idx / 7)
    }
  }
  const bassSteps = track.genre === 'Latin' ? [0, 3, 6, 8, 11, 14]
    : track.genre === 'Hip-Hop' ? [0, 7, 10]
    : track.genre === 'Jazz' ? [0, 4, 8, 12]
    : [0, 4, 8, 12]
  return { info, cfg, scale, progressions, chordRoot, melody, bassSteps, totalSteps, stepDur: 60 / info.bpm / 4 }
}

// ---------------- synth engine ----------------
let ctx = null, master = null, noiseBuf = null
let schedTimer = null, progressTimer = null
let comp = null, nextStep = 0, nextTime = 0, elapsedBase = 0, startedCtxTime = 0
let loadToken = 0

let _state = {
  status: 'idle', // idle | loading | playing | paused
  source: (typeof localStorage !== 'undefined' && localStorage.getItem('musicgo-player-source')) || 'youtube', // youtube | synth
  videoId: null, ytError: null, usingSynth: false,
  queue: [], index: -1, uid: null, trackId: null,
  progress: 0, duration: 0, volume: Math.min(1, Math.max(0, Number((typeof localStorage !== 'undefined' ? localStorage.getItem('musicgo-player-volume') : null) ?? 0.8) || 0.8)),
  shuffle: false, repeat: 'off', // off | all | one
  startedAt: 0,
}
const listeners = new Set()
function emit(patch = {}) { _state = { ..._state, ...patch }; listeners.forEach(l => l()) }
function subscribe(l) { listeners.add(l); return () => listeners.delete(l) }
function getSnapshot() { return _state }
export function usePlayer() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) }
export function isYouTubeActive() { return _state.source === 'youtube' && !_state.usingSynth && !!_state.videoId }

function ensureCtx() {
  if (ctx) return ctx
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return null
  ctx = new AC()
  const compNode = ctx.createDynamicsCompressor()
  master = ctx.createGain()
  master.gain.value = Math.pow(_state.volume, 1.6)
  master.connect(compNode); compNode.connect(ctx.destination)
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return ctx
}
function tone({ freq, time, dur, type = 'sine', gain = 0.15, glideTo = null, lowpass = null }) {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type; o.frequency.setValueAtTime(freq, time)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, time + dur)
  g.gain.setValueAtTime(0, time)
  g.gain.linearRampToValueAtTime(gain, time + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  if (lowpass) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass; o.connect(g); g.connect(f); f.connect(master) }
  else { o.connect(g); g.connect(master) }
  o.start(time); o.stop(time + dur + 0.05)
}
function noise({ time, dur, gain = 0.1, freq = 6000, type = 'highpass' }) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, time); g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  src.connect(f); f.connect(g); g.connect(master)
  src.start(time); src.stop(time + dur + 0.02)
}
function kick(time) { tone({ freq: 150, glideTo: 42, time, dur: 0.16, type: 'sine', gain: 0.55 }) }
function snare(time) { noise({ time, dur: 0.12, gain: 0.22, freq: 1800, type: 'bandpass' }); tone({ freq: 190, time, dur: 0.07, gain: 0.1, type: 'triangle' }) }

function scheduleStep(step, time) {
  if (!comp) return
  const { info, cfg, progressions, chordRoot, melody, bassSteps, scale } = comp
  const bar = Math.floor(step / 16), inBar = step % 16
  const chordDeg = progressions[Math.floor(bar / 2) % progressions.length]
  const root = chordRoot(chordDeg)
  const section = Math.floor(bar / 8)
  const drumsOn = cfg.drive > 0.4 && bar >= 2 && bar < BARS - 2
  if (drumsOn) {
    if (inBar % 4 === 0) kick(time)
    if (inBar === 4 || inBar === 12) snare(time)
    if (inBar % 2 === 0) noise({ time, dur: 0.04, gain: 0.06 + cfg.drive * 0.05 })
    if (info.scale === 'minor' && inBar === 14) noise({ time, dur: 0.1, gain: 0.08 })
  }
  if (inBar === 0) {
    [0, 2, 4].forEach(i => tone({ freq: midiHz(root + scale[(chordDeg + i) % 7] + 12), time, dur: comp.stepDur * 16, type: 'triangle', gain: 0.045, lowpass: 1600 }))
  }
  if (bassSteps.includes(inBar) && bar >= 1) tone({ freq: midiHz(root - 12), time, dur: comp.stepDur * 1.8, type: cfg.bassWave, gain: 0.20, lowpass: 700 })
  const m = melody[step]
  if (m != null && section > 0) tone({ freq: midiHz(m), time, dur: comp.stepDur * 1.7, type: cfg.wave, gain: 0.11, lowpass: cfg.wave === 'sawtooth' ? 3200 : null })
  if (bar >= BARS - 2 && inBar === 0) tone({ freq: midiHz(root + 12), time, dur: comp.stepDur * 14, type: 'triangle', gain: 0.08 })
}
function scheduler() {
  while (nextTime < ctx.currentTime + 0.18) {
    if (nextStep >= comp.totalSteps) break
    scheduleStep(nextStep, nextTime)
    nextTime += comp.stepDur; nextStep++
  }
}
function synthElapsed() {
  if (!ctx || !comp) return elapsedBase
  return _state.status === 'playing' ? Math.min(comp.info.duration, elapsedBase + (ctx.currentTime - startedCtxTime)) : elapsedBase
}
function currentProgress() {
  if (_state.source === 'youtube' && !_state.usingSynth) return ytGetTime() ?? _state.progress
  return synthElapsed()
}
function stopTimers() {
  if (schedTimer) clearInterval(schedTimer); schedTimer = null
  if (progressTimer) clearInterval(progressTimer); progressTimer = null
}
function startSynthProgressLoop() {
  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    if (!comp) return
    const p = synthElapsed()
    emit({ progress: p })
    if (p >= comp.info.duration - 0.05 && _state.status === 'playing') {
      if (_state.repeat === 'one') { seekSynth(0); return }
      const hasNext = _state.index < _state.queue.length - 1 || _state.repeat === 'all'
      if (hasNext) player.next(true)
      else player.stop()
    }
  }, 300)
}
function startYtProgressLoop() {
  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    if (_state.source !== 'youtube' || _state.usingSynth) return
    const t = ytGetTime(); const d = ytGetDuration()
    if (t != null) emit({ progress: t, ...(d ? { duration: d } : {}) })
  }, 500)
}
function beginFrom(offsetSec) {
  elapsedBase = offsetSec
  nextStep = Math.min(comp.totalSteps - 1, Math.floor(offsetSec / comp.stepDur))
  if (ctx.state === 'suspended') ctx.resume()
  startedCtxTime = ctx.currentTime
  nextTime = ctx.currentTime + 0.08
  if (schedTimer) clearInterval(schedTimer)
  schedTimer = setInterval(scheduler, 42)
  scheduler()
}
function startSynthFor(track, autoplay = true) {
  if (!ensureCtx()) { emit({ status: 'idle', ytError: 'Audio not supported on this device' }); return }
  comp = buildComposition(track)
  elapsedBase = 0; nextStep = 0
  emit({ duration: comp.info.duration, progress: 0, status: autoplay ? 'playing' : 'paused', startedAt: Date.now() })
  if (autoplay) { beginFrom(0); startSynthProgressLoop() }
}
function seekSynth(sec) {
  if (!comp || !ctx) return
  const target = Math.min(comp.info.duration - 0.2, Math.max(0, sec))
  const wasPlaying = _state.status === 'playing'
  if (schedTimer) clearInterval(schedTimer)
  elapsedBase = target
  emit({ progress: target })
  if (wasPlaying) beginFrom(target)
  else nextStep = Math.floor(target / comp.stepDur)
}
function setMediaSession(track) {
  if (!('mediaSession' in navigator) || !track) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: track.album })
    navigator.mediaSession.setActionHandler('play', () => player.toggle())
    navigator.mediaSession.setActionHandler('pause', () => player.toggle())
    navigator.mediaSession.setActionHandler('nexttrack', () => player.next())
    navigator.mediaSession.setActionHandler('previoustrack', () => player.prev())
  } catch (e) { /* unsupported */ }
}

export const player = {
  play(entry, queue = null) {
    const trackId = entry?.trackId ?? entry
    const uid = entry?.uid || null
    if (!TRACK_BY_ID[trackId]) return false
    // start loading the YouTube API *now*, inside the user's tap, so the
    // iframe is ready (and autoplay is permitted) as soon as possible
    if (_state.source === 'youtube') loadYouTubeApi()
    const q = (queue && queue.length ? queue : [{ uid, trackId }]).filter(e => TRACK_BY_ID[e.trackId ?? e])
      .map(e => ({ uid: e.uid || null, trackId: e.trackId ?? e }))
    const index = Math.max(0, q.findIndex(e => (uid ? e.uid === uid : e.trackId === trackId)))
    this.load(q, index, true)
    return true
  },
  load(queue, index, autoplay = true) {
    const entry = queue[index]; if (!entry) return
    const track = TRACK_BY_ID[entry.trackId]
    const token = ++loadToken
    stopTimers()
    ytPause()
    comp = null
    setMediaSession(track)
    if (_state.source === 'youtube') {
      emit({ queue, index, uid: entry.uid, trackId: entry.trackId, videoId: null, ytError: null, usingSynth: false, progress: 0, duration: 0, status: autoplay ? 'loading' : 'paused', startedAt: Date.now() })
      resolveVideoId(track).then((id) => {
        if (token !== loadToken) return
        if (id) {
          emit({ videoId: id, status: autoplay ? 'playing' : 'paused' })
          ytSetVolume(_state.volume)
          startYtProgressLoop()
        } else {
          // tear down the early-created iframe: its slot is about to
          // unmount, and leaving the player object alive would break
          // every later YouTube track this session
          ytDestroy()
          emit({ usingSynth: true, ytError: 'No YouTube match found — playing synth version' })
          startSynthFor(track, autoplay)
        }
      }).catch(() => {
        if (token !== loadToken) return
        ytDestroy()
        emit({ usingSynth: true, ytError: 'YouTube unreachable — playing synth version' })
        startSynthFor(track, autoplay)
      })
    } else {
      emit({ queue, index, uid: entry.uid, trackId: entry.trackId, videoId: null, ytError: null, usingSynth: true, progress: 0, startedAt: Date.now(), status: autoplay ? 'playing' : 'paused' })
      startSynthFor(track, autoplay)
    }
  },
  // called by the YouTube iframe when a video errors (region lock, removed…)
  fallbackToSynth(reason = 'YouTube playback failed') {
    if (_state.usingSynth || !_state.trackId) return
    const track = TRACK_BY_ID[_state.trackId]
    loadToken++
    stopTimers()
    // destroy the iframe player for real: the slot unmounts with the synth
    // UI, and a stale player object would silently swallow every later
    // loadVideoById (YouTube would never work again until the app reloads)
    ytDestroy()
    emit({ usingSynth: true, ytError: `${reason} — playing synth version`, videoId: null })
    startSynthFor(track, _state.status === 'playing' || _state.status === 'loading')
  },
  syncYouTubeDuration() {
    const d = ytGetDuration()
    if (d && _state.source === 'youtube' && !_state.usingSynth) emit({ duration: d })
  },
  toggle() {
    if (_state.status === 'playing') this.pause()
    else if (_state.status === 'paused') this.resume()
  },
  pause() {
    if (_state.status !== 'playing') return
    if (_state.source === 'youtube' && !_state.usingSynth) {
      ytPause()
      emit({ status: 'paused', progress: ytGetTime() ?? _state.progress })
      return
    }
    if (!ctx || !comp) return
    elapsedBase = synthElapsed()
    if (schedTimer) clearInterval(schedTimer)
    ctx.suspend()
    emit({ status: 'paused', progress: elapsedBase })
  },
  resume() {
    if (_state.status !== 'paused') return
    emit({ status: 'playing', startedAt: Date.now() })
    if (_state.source === 'youtube' && !_state.usingSynth) {
      ytPlay(); ytSetVolume(_state.volume); startYtProgressLoop()
      return
    }
    if (!ctx || !comp) return
    beginFrom(elapsedBase)
    startSynthProgressLoop()
  },
  stop() {
    loadToken++
    stopTimers()
    ytDestroy()
    if (ctx) ctx.suspend()
    comp = null
    emit({ status: 'idle', queue: [], index: -1, uid: null, trackId: null, videoId: null, ytError: null, usingSynth: false, progress: 0, duration: 0 })
  },
  next(auto = false) {
    const { queue, index, shuffle, repeat } = _state
    if (!queue.length) return
    let n
    if (shuffle && queue.length > 1) { do { n = Math.floor(Math.random() * queue.length) } while (n === index) }
    else n = index + 1
    if (n >= queue.length) { if (auto && repeat !== 'all') { this.stop(); return } n = 0 }
    this.load(queue, n, true)
  },
  prev() {
    const { queue, index } = _state
    if (!queue.length) return
    if (currentProgress() > 3) { this.seek(0); return }
    this.load(queue, (index - 1 + queue.length) % queue.length, true)
  },
  seek(sec) {
    if (_state.source === 'youtube' && !_state.usingSynth) { ytSeekTo(sec); emit({ progress: sec }); return }
    seekSynth(sec)
  },
  setVolume(v) {
    const volume = Math.min(1, Math.max(0, v))
    try { localStorage.setItem('musicgo-player-volume', String(volume)) } catch (e) { /* storage unavailable */ }
    if (master && ctx) master.gain.setTargetAtTime(Math.pow(volume, 1.6), ctx.currentTime, 0.03)
    ytSetVolume(volume)
    emit({ volume })
  },
  setSource(src) {
    if (src !== 'youtube' && src !== 'synth') return
    if (_state.source === src) return
    try { localStorage.setItem('musicgo-player-source', src) } catch (e) { /* noop */ }
    const { queue, index, trackId } = _state
    const wasPlaying = _state.status === 'playing' || _state.status === 'loading'
    loadToken++
    stopTimers()
    ytDestroy()
    if (ctx) ctx.suspend()
    comp = null
    emit({ source: src, videoId: null, ytError: null, usingSynth: src === 'synth' })
    if (trackId && queue.length) this.load(queue, index, wasPlaying)
  },
  toggleShuffle() { emit({ shuffle: !_state.shuffle }) },
  cycleRepeat() { emit({ repeat: _state.repeat === 'off' ? 'all' : _state.repeat === 'all' ? 'one' : 'off' }) },
}
export function currentTrack() { return _state.trackId ? TRACK_BY_ID[_state.trackId] : null }
