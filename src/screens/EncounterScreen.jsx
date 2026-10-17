import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACKS, RARITY } from '../data/tracks'
import { ITEMS, ITEM_BY_ID } from '../data/items'
import { ArrowLeft, X } from 'lucide-react'

export default function EncounterScreen() {
  const { dropId } = useParams()
  const navigate = useNavigate()
  const drops = useStore(s => s.drops) || []
  const removeDrop = useStore(s => s.removeDrop)
  const markCaught = useStore(s => s.markCaught)
  const catchTrack = useStore(s => s.catchTrack)
  const consumeItem = useStore(s => s.consumeItem)
  const inventory = useStore(s => s.inventory) || {}
  const weather = useStore(s => s.weather)

  const [cachedDrop, setCachedDrop] = useState(null)
  const foundDrop = drops.find(d => d.id === dropId)
  useEffect(() => { if (foundDrop) setCachedDrop(foundDrop) }, [foundDrop])
  const drop = foundDrop || cachedDrop
  const track = drop ? TRACKS.find(t => t.id === drop.trackId) : null

  const [ringScale, setRingScale] = useState(1)
  const [ringDir, setRingDir] = useState(-1)
  const [throwState, setThrowState] = useState('idle')
  const [wobbleCount, setWobbleCount] = useState(0)
  const [selectedItem, setSelectedItem] = useState('ball')
  const [berryUsed, setBerryUsed] = useState(false)
  const [curveball, setCurveball] = useState(false)
  const [pokemonState, setPokemonState] = useState('idle')
  const [quality, setQuality] = useState('')
  const [result, setResult] = useState(null)
  const [arMode, setArMode] = useState(false)
  // flick state
  const [drag, setDrag] = useState(null) // {startX,startY,curX,curY}
  const rafRef = useState({ current: null })[0]
  const lastRef = useState({ current: performance.now() })[0]
  const ringScaleRef = useState({ current: 1 })[0]

  useEffect(() => {
    if (throwState !== 'idle') return
    const tick = (now) => {
      const dt = now - lastRef.current
      lastRef.current = now
      setRingScale(s => {
        let next = s + ringDir * 0.00035 * dt
        if (next <= 0.25) { setRingDir(1); next = 0.25 }
        if (next >= 1) { setRingDir(-1); next = 1 }
        ringScaleRef.current = next
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [throwState, ringDir])

  useEffect(() => {
    if (throwState !== 'idle') return
    const iv = setInterval(() => {
      const r = Math.random()
      if (r < 0.12) { setPokemonState('attack'); setTimeout(() => setPokemonState('idle'), 700) }
      else if (r < 0.28) { setPokemonState('dodge'); setTimeout(() => setPokemonState('idle'), 600) }
    }, 2200)
    return () => clearInterval(iv)
  }, [throwState])

  if (!drop || !track) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-center p-6">
        <p className="text-slate-400">This drop has vanished.</p>
        <button onClick={() => navigate('/map')} className="mt-4 px-4 py-2 bg-fuchsia-500 rounded-xl">Back to Map</button>
      </div>
    )
  }

  const rarity = RARITY[track.rarity]
  const item = ITEM_BY_ID[selectedItem]
  const weatherBoost = weather && weather.boost && weather.boost.includes(track.genre)
  const cp = track.stats.cp || (track.stats.energy * 10 + track.stats.dance * 5)

  const ringColor = ringScale <= 0.3 ? '#22c55e' : ringScale <= 0.45 ? '#eab308' : ringScale <= 0.6 ? '#f97316' : '#ef4444'

  const doThrow = (scaleOverride) => {
    if (throwState !== 'idle') return
    if (pokemonState === 'dodge') {}
    let useId = selectedItem
    if (!consumeItem(useId)) {
      if (useId !== 'ball' && consumeItem('ball')) { useId = 'ball'; setSelectedItem('ball') }
      else return
    }
    const it = ITEM_BY_ID[useId]
    const scale = scaleOverride ?? ringScaleRef.current
    let q = 'OK'
    let qMult = 1.0
    if (scale <= 0.3) { q = 'Excellent'; qMult = 2.0 }
    else if (scale <= 0.45) { q = 'Great'; qMult = 1.6 }
    else if (scale <= 0.6) { q = 'Nice'; qMult = 1.25 }
    setQuality(q)
    setThrowState('throwing')

    const mult = (it?.mult || 1) * qMult * (curveball ? 1.2 : 1) * (berryUsed ? 1.5 : 1) * (weatherBoost ? 1.2 : 1) * (pokemonState === 'dodge' ? 0.5 : 1)
    const critical = Math.random() < 0.05 && q !== 'OK' && q !== 'Miss'

    setTimeout(() => {
      setThrowState('wobble')
      const res = catchTrack(track.id, mult, Math.random() < 0.01)
      const fled = !res.success && Math.random() < 0.12
      const wobbles = res.success ? (1 + Math.floor(Math.random() * 3)) : (1 + Math.floor(Math.random() * 2))
      setWobbleCount(wobbles)
      setTimeout(() => {
        if (fled) { setThrowState('fled'); removeDrop(drop.id) }
        else if (res.success) { setThrowState('caught'); markCaught(drop.id); setResult({ ...res, quality: q, mult, critical }) }
        else { setThrowState('escaped'); setResult({ ...res, quality: q, mult, critical }) }
      }, wobbles * 600)
    }, 700)
  }

  // flick handlers
  const onPointerDown = (e) => {
    if (throwState !== 'idle') return
    setDrag({ startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY })
  }
  const onPointerMove = (e) => {
    if (!drag) return
    setDrag(d => d ? { ...d, curX: e.clientX, curY: e.clientY } : null)
  }
  const onPointerUp = () => {
    if (!drag) return
    const dy = drag.startY - drag.curY
    const dx = drag.curX - drag.startX
    if (dy > 40) {
      // flick up -> throw
      doThrow(ringScaleRef.current)
    }
    setDrag(null)
  }

  const resetEncounter = () => {
    setThrowState('idle')
    setWobbleCount(0)
    setResult(null)
    setQuality('')
    setBerryUsed(false)
    setCurveball(false)
    setRingScale(1)
    setRingDir(-1)
    ringScaleRef.current = 1
    setPokemonState('idle')
  }

  const close = () => {
    if (result?.success || throwState === 'fled') removeDrop(drop.id)
    navigate('/map')
  }

  const bg = arMode
    ? 'linear-gradient(to bottom, #87ceeb 0%, #b8e6b8 55%, #5a9a4a 100%)'
    : 'linear-gradient(to bottom, #5ba3d9 0%, #8fc97a 45%, #4a8a3a 70%, #2d5a2a 100%)'

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: bg }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/map')} className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white">
          <X size={18} />
        </button>
        <div className="text-center">
          <div className="text-sm font-bold text-white drop-shadow">{track.title}</div>
          <div className="text-[10px] text-white/80 drop-shadow">{track.artist} · CP {cp}</div>
        </div>
        <div className="flex items-center gap-2">
          {weatherBoost && <span className="text-lg" title="Weather boosted">🌤️</span>}
          <button onClick={() => setArMode(a => !a)} className="px-2 py-1 rounded-full bg-black/40 text-white text-[10px] font-bold">
            {arMode ? 'AR' : 'AR+'}
          </button>
        </div>
      </div>

      {/* Arena */}
      <div
        className="flex-1 relative flex items-center justify-center"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Pokemon + catch ring centered together */}
        <div className="absolute left-1/2 top-[32%] -translate-x-1/2 -translate-y-1/2">
          {/* Ground shadow */}
          <div className="absolute left-1/2 top-[62%] -translate-x-1/2 w-72 h-10 rounded-full bg-black/40 blur-md" />
          {/* Catch ring */}
          {throwState === 'idle' && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              {/* inner target circle */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" style={{ width: 60, height: 60 }} />
              <div className="rounded-full border-4" style={{
                width: `${ringScale * 360}px`,
                height: `${ringScale * 360}px`,
                borderColor: ringColor,
                boxShadow: `0 0 24px ${ringColor}, inset 0 0 16px ${ringColor}55`,
              }} />
            </div>
          )}
          {/* Pokemon */}
          <div className={`relative transition-all duration-300 ${pokemonState === 'dodge' ? 'translate-x-20 opacity-70' : ''} ${pokemonState === 'attack' ? 'scale-110' : ''}`}>
            <div className="w-72 h-72 rounded-3xl flex items-center justify-center text-9xl shadow-2xl" style={{ background: `linear-gradient(135deg, hsl(${track.hue},70%,45%), hsl(${(track.hue+60)%360},70%,30%))` }}>
              🎵
            </div>
            {pokemonState === 'attack' && <div className="absolute -top-4 -right-4 text-3xl animate-pulse">⚡</div>}
            {pokemonState === 'dodge' && <div className="absolute -top-4 -right-4 text-3xl">💨</div>}
            {track.rarity === 'legendary' && <div className="absolute -top-2 -left-2 text-2xl">👑</div>}
          </div>
        </div>

        {/* Ball in flight */}
        {throwState === 'throwing' && (
          <div className="absolute left-1/2 bottom-24 -translate-x-1/2 text-5xl animate-bounce">⚪</div>
        )}

        {/* Wobble */}
        {throwState === 'wobble' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl" style={{ animation: `spin-slow ${0.6 / wobbleCount}s linear infinite` }}>⚪</div>
        )}

        {/* Drag trajectory preview */}
        {drag && (
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            <line x1={drag.startX} y1={drag.startY} x2={drag.curX} y2={drag.curY} stroke="white" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
          </svg>
        )}

        {/* Quality popup */}
        {quality && throwState !== 'idle' && throwState !== 'throwing' && throwState !== 'wobble' && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-2xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            {quality}!
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="px-4 pb-4 space-y-3">
        {/* Modifiers */}
        {throwState === 'idle' && (
          <div className="flex gap-2">
            <button onClick={() => setCurveball(c => !c)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${curveball ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-200' : 'border-white/20 bg-black/30 text-white/80'}`}>
              🌀 Curveball {curveball ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => { if (consumeItem('berry')) setBerryUsed(true) }} disabled={berryUsed || !(inventory.berry > 0)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${berryUsed ? 'border-red-500 bg-red-500/20 text-red-200' : 'border-white/20 bg-black/30 text-white/80'} disabled:opacity-40`}>
              🍓 Razz Berry {berryUsed ? 'USED' : `x${inventory.berry || 0}`}
            </button>
          </div>
        )}

        {/* Ball selector + ball */}
        {throwState === 'idle' && (
          <div className="flex items-center gap-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
              {ITEMS.filter(i => i.effect === 'catch').map(i => (
                <button key={i.id} onClick={() => setSelectedItem(i.id)}
                  className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border ${selectedItem === i.id ? 'border-white bg-white/20' : 'border-white/20 bg-black/30'}`}>
                  <span className="text-2xl">{i.icon}</span>
                  <span className="text-[9px] text-white/80">x{inventory[i.id] || 0}</span>
                </button>
              ))}
            </div>
            <div className="text-center">
              <div className="text-4xl mb-1">⚪</div>
              <div className="text-[9px] text-white/70">Flick up</div>
            </div>
          </div>
        )}

        {/* Result */}
        {(throwState === 'caught' || throwState === 'escaped' || throwState === 'fled') && (
          <div className="bg-black/60 rounded-2xl p-4 text-center">
            {throwState === 'fled' ? (
              <>
                <div className="text-5xl">🏃</div>
                <h3 className="mt-2 text-lg font-bold text-amber-400">It fled!</h3>
                <p className="text-white/80 text-sm">{track.title} ran away.</p>
              </>
            ) : throwState === 'caught' ? (
              <>
                <div className="text-5xl catch-pop">🎉</div>
                <h3 className="mt-2 text-lg font-bold text-green-400">Gotcha!</h3>
                <p className="text-white/80 text-sm">{track.title} was caught!{result?.shiny ? ' ✨ Shiny!' : ''}</p>
                <div className="mt-2 flex justify-center gap-4 text-sm">
                  <span className="text-fuchsia-300">+{result?.xp} XP</span>
                  <span className="text-amber-300">+{result?.coins} coins</span>
                </div>
                <div className="mt-1 text-[10px] text-white/60">{result?.quality} throw · x{result?.mult?.toFixed(2)}{result?.critical ? ' · Critical!' : ''}</div>
              </>
            ) : (
              <>
                <div className="text-5xl">💨</div>
                <h3 className="mt-2 text-lg font-bold text-red-400">It broke free!</h3>
                <p className="text-white/80 text-sm">Try again with better timing.</p>
                <div className="mt-1 text-[10px] text-white/60">{result?.quality} throw</div>
              </>
            )}
            <div className="mt-3 flex gap-3">
              {throwState === 'escaped' && (
                <button onClick={resetEncounter} className="flex-1 py-3 rounded-2xl bg-white/20 font-semibold">Try Again</button>
              )}
              <button onClick={close} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold">
                {throwState === 'caught' ? 'Continue' : 'Run'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
