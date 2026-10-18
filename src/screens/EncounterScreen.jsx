import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACK_BY_ID, GENRE_EMOJI } from '../data/tracks'
import { DISCS, BERRIES } from '../data/items'
import { catchDifficulty, catchSuccessRate } from '../utils/game'
import TrackArt from '../components/TrackArt'
import { player } from '../utils/player'
import { X } from 'lucide-react'

export default function EncounterScreen() {
  const { spawnId } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const spawn = (store.spawns || []).find(s => s.id === spawnId)
  const [cachedSpawn, setCachedSpawn] = useState(spawn || null)
  useEffect(() => { if (spawn) setCachedSpawn(spawn) }, [spawn])
  const sp = spawn || cachedSpawn
  const track = sp ? TRACK_BY_ID[sp.trackId] : null

  const [ring, setRing] = useState(1)
  const ringRef = useRef(1)
  const [phase, setPhase] = useState('idle') // idle|throwing|wobble|caught|escaped|fled
  const [wobbles, setWobbles] = useState(0)
  const [discId, setDiscId] = useState('disc')
  const [berry, setBerry] = useState(null) // {id, mult, calm, candy}
  const [curve, setCurve] = useState(false)
  const [mon, setMon] = useState('idle') // idle|attack|dodge
  const [quality, setQuality] = useState('')
  const [result, setResult] = useState(null)
  const [ar, setAr] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const videoRef = useRef(null)
  const drag = useRef(null)
  const [trail, setTrail] = useState(null)
  const [throwsUsed, setThrowsUsed] = useState(0)

  const weatherBoost = store.weather?.boost?.includes(track?.genre)
  const disc = DISCS.find(d => d.id === discId) || DISCS[0]
  const rate = track ? catchSuccessRate({ track, ballMult: disc.mult, berryMult: berry?.mult || 1, curveball: curve, qualityMult: 1, weatherBoost }) : 0
  const diff = catchDifficulty(rate)

  useEffect(() => {
    let raf, last = performance.now(), dir = -1, val = 1
    const tick = (now) => {
      const dt = now - last; last = now
      if (phase === 'idle') {
        val += dir * 0.00045 * dt
        if (val <= 0.22) { val = 0.22; dir = 1 } if (val >= 1) { val = 1; dir = -1 }
        ringRef.current = val; setRing(val)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [phase])

  useEffect(() => {
    if (phase !== 'idle') return
    const iv = setInterval(() => {
      if (berry?.calm) return
      const r = Math.random()
      if (r < 0.14) { setMon('attack'); setTimeout(() => setMon('idle'), 650) }
      else if (r < 0.32) { setMon('dodge'); setTimeout(() => setMon('idle'), 600) }
    }, 2000)
    return () => clearInterval(iv)
  }, [phase, berry])

  useEffect(() => () => { videoRef.current?.srcObject?.getTracks?.().forEach(t => t.stop()) }, [])

  if (!sp || !track) return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-slate-400">This track has vanished.</p>
      <button onClick={() => navigate('/map')} className="mt-4 px-4 py-2 bg-fuchsia-500 rounded-xl font-bold">Back to Map</button>
    </div>
  )

  const toggleAr = async () => {
    const next = !ar; setAr(next)
    if (next && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        setCameraOn(true); setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 50)
      } catch { setCameraOn(false) }
    } else { videoRef.current?.srcObject?.getTracks?.().forEach(t => t.stop()); setCameraOn(false) }
  }

  const applyBerry = (b) => {
    if (berry || !store.consumeItem(b.id)) return
    setBerry(b)
  }

  const doThrow = () => {
    if (phase !== 'idle') return
    if (!store.consumeItem(discId)) {
      if (discId !== 'disc' && (store.inventory.disc || 0) > 0) setDiscId('disc')
      return
    }
    setThrowsUsed(t => t + 1)
    const s = ringRef.current
    let q = 'OK', qm = 1
    if (s <= 0.30) { q = 'Excellent'; qm = 2 } else if (s <= 0.45) { q = 'Great'; qm = 1.6 } else if (s <= 0.62) { q = 'Nice'; qm = 1.25 }
    if (mon === 'attack') qm *= 0.4 // deflected by attack
    if (mon === 'dodge') qm *= 0.5
    setQuality(q); setPhase('throwing')
    setTimeout(() => {
      const res = store.attemptCatch({
        trackId: track.id, ballMult: disc.mult, berryMult: berry?.mult || 1, berryId: berry?.id || null,
        curveball: curve, qualityMult: qm, quality: q, weatherBoost, source: sp.source || 'wild', shadow: !!sp.shadow,
      })
      setResult(res)
      if (res.success) { setWobbles(3); setPhase('wobble'); setTimeout(() => { setPhase('caught'); store.removeSpawn(sp.id) }, 1900) }
      else if (res.fled) { setPhase('wobble'); setWobbles(1); setTimeout(() => { setPhase('fled'); store.removeSpawn(sp.id) }, 800) }
      else { setWobbles(1 + Math.floor(Math.random() * 2)); setPhase('wobble'); setTimeout(() => setPhase('escaped'), 1300) }
    }, 650)
  }

  const onDown = (e) => { if (phase === 'idle') drag.current = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, maxDx: 0 } }
  const onMove = (e) => { if (!drag.current) return; drag.current.x = e.clientX; drag.current.y = e.clientY; drag.current.maxDx = Math.max(drag.current.maxDx, Math.abs(e.clientX - drag.current.x0)); setTrail({ ...drag.current }) }
  const onUp = () => {
    if (!drag.current) return
    const dy = drag.current.y0 - drag.current.y
    if (drag.current.maxDx > 45) setCurve(true)
    if (dy > 45) doThrow()
    drag.current = null; setTrail(null)
  }
  const reset = () => { setPhase('idle'); setResult(null); setQuality(''); setWobbles(0) }

  const ringColor = ring <= 0.30 ? '#22c55e' : ring <= 0.45 ? '#eab308' : ring <= 0.62 ? '#f97316' : '#ef4444'
  const bg = ar ? 'linear-gradient(to bottom,#7dd3fc,#bbf7d0 55%,#65a30d)' : 'linear-gradient(to bottom,#1e1b4b,#155e75 45%,#14532d 75%,#052e16)'

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: bg }}>
      {ar && cameraOn && <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />}
      {ar && !cameraOn && <div className="absolute top-16 self-center z-10 bg-black/50 text-[10px] px-2 py-1 rounded-full text-white">AR: camera unavailable — simulated backdrop</div>}
      <div className="relative flex items-center justify-between px-4 py-3 z-10">
        <button onClick={() => navigate('/map')} className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white"><X size={18} /></button>
        <div className="text-center">
          <div className="text-sm font-bold text-white drop-shadow">{track.title} {sp.shadow ? '🌑 Shadow' : ''}</div>
          <div className="text-[10px] text-white/85">{track.artist} · CP {track.atk * 10} · {track.genre}</div>
          <div className="text-[9px]" style={{ color: diff.color }}>● {diff.label} catch · {Math.round(rate * 100)}%</div>
        </div>
        <button onClick={toggleAr} className="px-2.5 py-1 rounded-full bg-black/40 text-white text-[10px] font-bold">{ar ? 'AR+ ON' : 'AR'}</button>
      </div>

      <div className="flex-1 relative flex items-center justify-center touch-none select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
        <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2">
          <div className="absolute left-1/2 top-[62%] -translate-x-1/2 w-64 h-9 rounded-full bg-black/40 blur-md" />
          {phase === 'idle' && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
              <div className="absolute rounded-full border-2 border-white/50" style={{ width: 56, height: 56 }} />
              <div className="rounded-full border-4 transition-none" style={{ width: ring * 330, height: ring * 330, borderColor: ringColor, boxShadow: `0 0 22px ${ringColor}` }} />
            </div>
          )}
          <div className={`relative transition-all duration-300 ${mon === 'dodge' ? 'translate-x-24 opacity-70' : ''} ${mon === 'attack' ? 'scale-110 -translate-y-3' : ''} ${phase === 'wobble' || phase === 'caught' ? 'opacity-0 scale-50' : ''}`}>
            <TrackArt track={track} inst={{ shiny: false, shadow: sp.shadow }} size="xl" rounded="rounded-3xl" />
            {mon === 'attack' && <div className="absolute -top-4 -right-3 text-3xl animate-pulse">💥</div>}
            {mon === 'dodge' && <div className="absolute -top-4 -right-3 text-3xl">💨</div>}
            {weatherBoost && <div className="absolute -top-3 -left-2 text-xl" title="Weather boosted">🌤️</div>}
          </div>
        </div>
        {phase === 'throwing' && <div className="absolute left-1/2 bottom-28 -translate-x-1/2 text-5xl animate-bounce">{disc.icon}</div>}
        {phase === 'wobble' && <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 text-5xl" style={{ animation: `wobble 0.45s ease-in-out ${wobbles * 2} alternate` }}>{disc.icon}</div>}
        {trail && <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%"><line x1={trail.x0} y1={trail.y0} x2={trail.x} y2={trail.y} stroke="white" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" /></svg>}
        {quality && phase !== 'idle' && phase !== 'wobble' && phase !== 'throwing' && <div className="absolute top-[22%] left-1/2 -translate-x-1/2 text-3xl font-black text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,.9)' }}>{quality}!</div>}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/70 bg-black/30 px-2 py-1 rounded-full">Flick up to throw · flick sideways first for curveball {curve ? '🌀 ON' : ''}</div>
      </div>

      <div className="relative px-4 pb-5 space-y-3 z-10">
        {phase === 'idle' && (
          <>
            <div className="flex gap-2">
              <button onClick={() => setCurve(c => !c)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold border ${curve ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100' : 'border-white/25 bg-black/35 text-white/85'}`}>🌀 Curveball {curve ? 'ON' : 'OFF'}</button>
              {BERRIES.map(b => (
                <button key={b.id} onClick={() => applyBerry(b)} disabled={!!berry || !(store.inventory[b.id] > 0)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold border ${berry?.id === b.id ? 'border-amber-400 bg-amber-500/25' : 'border-white/25 bg-black/35 text-white/85'} disabled:opacity-40`}>{b.icon} {b.name.split(' ')[0]} ×{store.inventory[b.id] || 0}</button>
              ))}
            </div>
            {berry && <div className="text-center text-[10px] text-amber-200">{berry.icon} {berry.name} active{berry.calm ? ' — track calmed' : ''}{berry.candy ? ' — double candy' : ''}</div>}
            <div className="flex items-end gap-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                {DISCS.map(d => (
                  <button key={d.id} onClick={() => setDiscId(d.id)} className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border ${discId === d.id ? 'border-white bg-white/20' : 'border-white/20 bg-black/35'}`}>
                    <span className="text-2xl">{d.icon}</span><span className="text-[9px] text-white/85">×{store.inventory[d.id] || 0}</span>
                  </button>
                ))}
              </div>
              <button onClick={doThrow} className="text-center bg-black/30 rounded-2xl px-3 py-2"><div className="text-4xl">{disc.icon}</div><div className="text-[9px] text-white/75">THROW</div></button>
            </div>
          </>
        )}
        {(phase === 'caught' || phase === 'escaped' || phase === 'fled') && (
          <div className="bg-black/70 rounded-2xl p-4 text-center text-white">
            {phase === 'fled' ? (<><div className="text-5xl">🏃</div><h3 className="mt-1 text-lg font-bold text-amber-400">It fled!</h3><p className="text-sm text-white/80">{track.title} ran away after {throwsUsed} throw(s).</p></>)
              : phase === 'caught' ? (<><div className="text-5xl catch-pop">🎉</div><h3 className="mt-1 text-lg font-bold text-emerald-400">{result?.critical ? 'Critical Catch!' : 'Gotcha!'}</h3><p className="text-sm text-white/85">{track.title} was caught!{result?.shiny ? ' ✨ SHINY!' : ''}</p><div className="mt-2 flex justify-center gap-3 text-xs"><span className="text-fuchsia-300">+{result?.xp} XP</span><span className="text-amber-300">+{result?.coins} coins</span><span className="text-violet-300">+{result?.stardust} dust</span><span>🍬 +{result?.candy}</span></div><div className="text-[10px] text-white/60 mt-1">{quality} throw · from {sp.source}</div></>)
              : (<><div className="text-5xl">💨</div><h3 className="mt-1 text-lg font-bold text-red-400">It broke free!</h3><p className="text-sm text-white/80">Aim for a smaller ring, try a better disc or a berry.</p></>)}
            <div className="mt-3 flex gap-2">
              {phase === 'escaped' && <button onClick={reset} className="flex-1 py-3 rounded-2xl bg-white/20 font-bold">Try Again</button>}
              {phase === 'caught' && result?.inst && <button onClick={() => player.play({ uid: result.inst.uid, trackId: result.inst.trackId })} className="flex-1 py-3 rounded-2xl bg-white text-black font-bold">🎧 Listen now</button>}
              <button onClick={() => navigate('/map')} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold">{phase === 'caught' ? 'Continue' : 'Run'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
