import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACKS, RARITY } from '../data/tracks'
import { ITEMS, ITEM_BY_ID } from '../data/items'
import { ArrowLeft } from 'lucide-react'

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

  const cachedDropRef = useRef(null)
  const foundDrop = drops.find(d => d.id === dropId)
  if (foundDrop) cachedDropRef.current = foundDrop
  const drop = foundDrop || cachedDropRef.current
  const track = drop ? TRACKS.find(t => t.id === drop.trackId) : null

  // ring state
  const [ringScale, setRingScale] = useState(1)
  const [ringDir, setRingDir] = useState(-1)
  const [throwState, setThrowState] = useState('idle') // idle | throwing | wobble | caught | escaped | fled
  const [wobbleCount, setWobbleCount] = useState(0)
  const [selectedItem, setSelectedItem] = useState('ball')
  const [berryUsed, setBerryUsed] = useState(false)
  const [curveball, setCurveball] = useState(false)
  const [pokemonState, setPokemonState] = useState('idle') // idle | attack | dodge
  const [quality, setQuality] = useState('')
  const [result, setResult] = useState(null)
  const [arMode, setArMode] = useState(false)
  const rafRef = useRef(null)
  const lastRef = useRef(performance.now())
  const ringScaleRef = useRef(1)

  // ring animation
  useEffect(() => {
    if (throwState !== 'idle') return
    const tick = (now) => {
      const dt = now - lastRef.current
      lastRef.current = now
      setRingScale(s => {
        let next = s + ringDir * 0.0004 * dt
        if (next <= 0.3) { setRingDir(1); next = 0.3 }
        if (next >= 1) { setRingDir(-1); next = 1 }
        ringScaleRef.current = next
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [throwState, ringDir])

  // pokemon movement/attacks
  useEffect(() => {
    if (throwState !== 'idle') return
    const iv = setInterval(() => {
      const r = Math.random()
      if (r < 0.15) { setPokemonState('attack'); setTimeout(() => setPokemonState('idle'), 600) }
      else if (r < 0.3) { setPokemonState('dodge'); setTimeout(() => setPokemonState('idle'), 500) }
    }, 2000)
    return () => clearInterval(iv)
  }, [throwState])

  if (!drop || !track) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400">This drop has vanished.</p>
        <button onClick={() => navigate('/map')} className="mt-4 px-4 py-2 bg-fuchsia-500 rounded-xl">Back to Map</button>
      </div>
    )
  }

  const rarity = RARITY[track.rarity]
  const item = ITEM_BY_ID[selectedItem]
  const weatherBoost = weather && weather.boost && weather.boost.includes(track.genre)

  const throwBall = () => {
    if (throwState !== 'idle') return
    if (pokemonState === 'dodge') { // missed because dodging
      // still throw but lower chance
    }
    let useId = selectedItem
    if (!consumeItem(useId)) {
      if (useId !== 'ball' && consumeItem('ball')) { useId = 'ball'; setSelectedItem('ball') }
      else return
    }
    const it = ITEM_BY_ID[useId]
    const scale = ringScaleRef.current
    let q = 'Miss'
    let qMult = 0.7
    if (scale <= 0.35) { q = 'Excellent'; qMult = 2.0 }
    else if (scale <= 0.5) { q = 'Great'; qMult = 1.6 }
    else if (scale <= 0.65) { q = 'Nice'; qMult = 1.25 }
    else { q = 'OK'; qMult = 1.0 }
    setQuality(q)
    setThrowState('throwing')

    const mult = (it?.mult || 1) * qMult * (curveball ? 1.2 : 1) * (berryUsed ? 1.5 : 1) * (weatherBoost ? 1.2 : 1) * (pokemonState === 'dodge' ? 0.5 : 1)
    const critical = Math.random() < 0.05 && q !== 'Miss'

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
      }, wobbles * 700)
    }, 600)
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
  }

  const close = () => {
    if (result?.success || throwState === 'fled') removeDrop(drop.id)
    navigate('/map')
  }

  const ringColor = ringScale <= 0.35 ? '#22c55e' : ringScale <= 0.5 ? '#eab308' : ringScale <= 0.65 ? '#f97316' : '#ef4444'

  return (
    <div className="p-4 space-y-3">
      <button onClick={() => navigate('/map')} className="flex items-center gap-1 text-slate-400 text-sm">
        <ArrowLeft size={16} /> Run
      </button>

      {/* AR toggle */}
      <div className="flex justify-end">
        <button onClick={() => setArMode(a => !a)} className={`px-3 py-1 rounded-full text-[10px] font-bold ${arMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
          {arMode ? 'AR ON' : 'AR OFF'}
        </button>
      </div>

      {/* Arena */}
      <div onClick={throwState === 'idle' ? throwBall : undefined} className={`relative rounded-3xl overflow-hidden cursor-pointer ${arMode ? 'bg-gradient-to-b from-sky-900/40 to-green-900/40' : 'glass'} `} style={{ height: 360 }}>
        {/* Pokemon */}
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${pokemonState === 'dodge' ? 'translate-x-8' : ''} ${pokemonState === 'attack' ? 'scale-110' : ''}`}>
          <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-5xl float shadow-2xl" style={{ background: `linear-gradient(135deg, hsl(${track.hue},70%,45%), hsl(${(track.hue+60)%360},70%,30%))` }}>
            🎵
          </div>
          {pokemonState === 'attack' && <div className="absolute -top-2 -right-2 text-2xl">⚡</div>}
          {pokemonState === 'dodge' && <div className="absolute -top-2 -right-2 text-2xl">💨</div>}
        </div>

        {/* Catch ring */}
        {throwState === 'idle' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="rounded-full border-4" style={{
              width: `${ringScale * 160}px`,
              height: `${ringScale * 160}px`,
              borderColor: ringColor,
              boxShadow: `0 0 12px ${ringColor}`,
              transition: 'none',
            }} />
          </div>
        )}

        {/* Ball throwing animation */}
        {throwState === 'throwing' && (
          <div className="absolute left-1/2 bottom-4 -translate-x-1/2 text-4xl animate-bounce">⚪</div>
        )}

        {/* Wobble */}
        {throwState === 'wobble' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl" style={{ animation: `spin-slow 0.7s linear ${wobbleCount}` }}>⚪</div>
        )}

        {/* Info overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold drop-shadow">{track.title}</div>
            <div className="text-[10px] text-slate-300 drop-shadow">{track.artist}</div>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: rarity.color + '55', color: rarity.color }}>{rarity.label}</span>
            {weatherBoost && <span className="text-[10px] text-cyan-300">🌤️</span>}
          </div>
        </div>

        {/* Tap to throw hint */}
        {throwState === 'idle' && (
          <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-slate-300 drop-shadow">
            Tap anywhere to throw when the ring is small
          </div>
        )}
      </div>

      {/* Modifiers */}
      {throwState === 'idle' && (
        <div className="flex gap-2">
          <button onClick={() => setCurveball(c => !c)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${curveball ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300' : 'border-slate-700 text-slate-400'}`}>
            🌀 Curveball {curveball ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => { if (consumeItem('berry')) setBerryUsed(true) }} disabled={berryUsed || !(inventory.berry > 0)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${berryUsed ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-slate-700 text-slate-400'} disabled:opacity-40`}>
            🍓 Razz Berry {berryUsed ? 'USED' : `x${inventory.berry || 0}`}
          </button>
        </div>
      )}

      {/* Ball selector */}
      {throwState === 'idle' && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {ITEMS.filter(i => i.effect === 'catch').map(i => (
            <button key={i.id} onClick={() => setSelectedItem(i.id)}
              className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border ${selectedItem === i.id ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
              <span className="text-xl">{i.icon}</span>
              <span className="text-[10px] font-medium">{i.name}</span>
              <span className="text-[9px] text-slate-400">x{inventory[i.id] || 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* Throwing state */}
      {throwState === 'throwing' && (
        <div className="text-center py-4">
          <p className="text-slate-300 text-sm">Throwing...</p>
        </div>
      )}

      {/* Wobble */}
      {throwState === 'wobble' && (
        <div className="text-center py-4">
          <p className="text-slate-300 text-sm">...</p>
        </div>
      )}

      {/* Result */}
      {(throwState === 'caught' || throwState === 'escaped' || throwState === 'fled') && (
        <div className="glass rounded-2xl p-6 text-center">
          {throwState === 'fled' ? (
            <>
              <div className="text-6xl">🏃</div>
              <h3 className="mt-2 text-xl font-bold text-amber-400">It fled!</h3>
              <p className="text-slate-300 text-sm">{track.title} ran away.</p>
            </>
          ) : throwState === 'caught' ? (
            <>
              <div className="text-6xl catch-pop">🎉</div>
              <h3 className="mt-2 text-xl font-bold text-green-400">Gotcha!</h3>
              <p className="text-slate-300 text-sm">{track.title} was caught!{result?.shiny ? ' ✨ Shiny!' : ''}</p>
              <div className="mt-3 flex justify-center gap-4 text-sm">
                <span className="text-fuchsia-400">+{result?.xp} XP</span>
                <span className="text-amber-400">+{result?.coins} coins</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">{result?.quality} throw · x{result?.mult?.toFixed(2)}{result?.critical ? ' · Critical!' : ''}</div>
            </>
          ) : (
            <>
              <div className="text-6xl">💨</div>
              <h3 className="mt-2 text-xl font-bold text-red-400">It broke free!</h3>
              <p className="text-slate-300 text-sm">Try again with better timing.</p>
              <div className="mt-1 text-[10px] text-slate-500">{result?.quality} throw</div>
            </>
          )}
          <div className="mt-4 flex gap-3">
            {throwState === 'escaped' && (
              <button onClick={resetEncounter} className="flex-1 py-3 rounded-2xl bg-slate-800 font-semibold">Try Again</button>
            )}
            <button onClick={close} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold">
              {throwState === 'caught' ? 'Continue' : 'Run'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
