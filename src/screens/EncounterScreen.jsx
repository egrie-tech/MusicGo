import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACKS, RARITY } from '../data/tracks'
import { ITEMS, ITEM_BY_ID } from '../data/items'
import { ArrowLeft, Target } from 'lucide-react'

export default function EncounterScreen() {
  const { dropId } = useParams()
  const navigate = useNavigate()
  const drops = useStore(s => s.drops) || []
  const removeDrop = useStore(s => s.removeDrop)
  const markCaught = useStore(s => s.markCaught)
  const catchTrack = useStore(s => s.catchTrack)
  const consumeItem = useStore(s => s.consumeItem)
  const inventory = useStore(s => s.inventory)

  // cache the drop so transient store updates don't make it 'vanish'
  const [cachedDrop, setCachedDrop] = useState(null)
  const foundDrop = drops.find(d => d.id === dropId)
  useEffect(() => { if (foundDrop) setCachedDrop(foundDrop) }, [foundDrop])
  const drop = foundDrop || cachedDrop
  const track = drop ? TRACKS.find(t => t.id === drop.trackId) : null

  const [selectedItem, setSelectedItem] = useState('ball')
  const [phase, setPhase] = useState('ready') // ready | throwing | result
  const [result, setResult] = useState(null)
  const [sweetSpot, setSweetSpot] = useState(0.5)
  const [marker, setMarker] = useState(0)
  const [direction, setDirection] = useState(1)
  const [speed, setSpeed] = useState(0.012)
  const rafRef = useRef(null)
  const lastRef = useRef(performance.now())

  // animate marker
  useEffect(() => {
    if (phase !== 'ready') return
    const tick = (now) => {
      const dt = now - lastRef.current
      lastRef.current = now
      setMarker(m => {
        let next = m + direction * speed * dt
        if (next >= 1) { setDirection(-1); next = 1 }
        if (next <= 0) { setDirection(1); next = 0 }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, direction, speed])

  // difficulty by rarity
  useEffect(() => {
    if (!track) return
    const r = track.rarity
    const sp = r === 'common' ? 0.45 : r === 'uncommon' ? 0.4 : r === 'rare' ? 0.32 : r === 'epic' ? 0.25 : 0.18
    setSweetSpot(sp)
    setSpeed(r === 'common' ? 0.01 : r === 'uncommon' ? 0.013 : r === 'rare' ? 0.016 : r === 'epic' ? 0.02 : 0.024)
  }, [track])

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
  const inZone = Math.abs(marker - sweetSpot) < 0.12

  const throwDisc = () => {
    if (phase !== 'ready') return
    let useId = selectedItem
    if (!consumeItem(useId)) {
      if (useId !== 'ball' && consumeItem('ball')) {
        useId = 'ball'
        setSelectedItem('ball')
      } else {
        return
      }
    }
    const it = ITEM_BY_ID[useId]
    setPhase('throwing')
    const bonus = inZone ? 1.6 : (Math.abs(marker - sweetSpot) < 0.22 ? 1.15 : 0.85)
    const mult = (it?.mult || 1) * bonus
    setTimeout(() => {
      const res = catchTrack(track.id, mult)
      setResult({ ...res, bonus, mult })
      setPhase('result')
      if (res.success) markCaught(drop.id)
    }, 900)
  }

  const flee = () => {
    removeDrop(drop.id)
    navigate('/map')
  }

  const close = () => {
    if (result?.success) removeDrop(drop.id)
    navigate('/map')
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => navigate('/map')} className="flex items-center gap-1 text-slate-400 text-sm">
        <ArrowLeft size={16} /> Flee
      </button>

      {/* Track hero */}
      <div className="glass rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 40%, hsl(${track.hue},80%,50%), transparent 70%)` }} />
        <div className="relative">
          <div className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center text-5xl shadow-2xl float" style={{ background: `linear-gradient(135deg, hsl(${track.hue},70%,45%), hsl(${(track.hue+60)%360},70%,30%))` }}>
            🎵
          </div>
          <h2 className="mt-4 text-xl font-bold">{track.title}</h2>
          <p className="text-slate-300 text-sm">{track.artist}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: rarity.color + '33', color: rarity.color }}>{rarity.label}</span>
            <span className="text-xs text-slate-400">{track.genre} · {track.album}</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
            <Stat label="Energy" v={track.stats.energy} />
            <Stat label="Dance" v={track.stats.dance} />
            <Stat label="Tempo" v={track.stats.tempo} />
            <Stat label="Catch" v={Math.round(track.stats.catchRate * 100)} />
          </div>
        </div>
      </div>

      {/* Catch timing game */}
      {phase === 'ready' && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold flex items-center gap-1"><Target size={14} /> Timing</span>
            <span className={`text-xs ${inZone ? 'text-green-400' : 'text-slate-400'}`}>{inZone ? 'Sweet spot!' : 'Tap at the right moment'}</span>
          </div>
          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden">
            {/* sweet spot */}
            <div className="absolute top-0 bottom-0 rounded-full" style={{
              left: `${(sweetSpot - 0.12) * 100}%`,
              width: `${0.24 * 100}%`,
              background: 'rgba(34,197,94,0.35)',
            }} />
            <div className="absolute top-0 bottom-0 w-1 bg-white/80" style={{ left: `${marker * 100}%`, transform: 'translateX(-50%)' }} />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Hit the green zone for a catch bonus.</p>
        </div>
      )}

      {/* Item selector */}
      {phase === 'ready' && (
        <div className="glass rounded-2xl p-3">
          <div className="text-xs text-slate-400 mb-2">Choose your disc</div>
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
        </div>
      )}

      {/* Actions */}
      {phase === 'ready' && (
        <div className="flex gap-3">
          <button onClick={flee} className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 font-semibold">Flee</button>
          <button onClick={throwDisc} className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold shadow-lg shadow-fuchsia-500/30">
            Throw {item.icon}
          </button>
        </div>
      )}

      {phase === 'throwing' && (
        <div className="text-center py-8">
          <div className="text-6xl catch-pop">💿</div>
          <p className="mt-3 text-slate-300">Catching...</p>
        </div>
      )}

      {phase === 'result' && result && (
        <div className="glass rounded-2xl p-6 text-center">
          {result.success ? (
            <>
              <div className="text-6xl catch-pop">🎉</div>
              <h3 className="mt-2 text-xl font-bold text-green-400">Caught!</h3>
              <p className="text-slate-300 text-sm">{track.title} added to your collection.</p>
              <div className="mt-3 flex justify-center gap-4 text-sm">
                <span className="text-fuchsia-400">+{result.xp} XP</span>
                <span className="text-amber-400">+{result.coins} coins</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">Timing bonus: x{result.bonus.toFixed(2)}</div>
            </>
          ) : (
            <>
              <div className="text-6xl">💨</div>
              <h3 className="mt-2 text-xl font-bold text-red-400">It broke free!</h3>
              <p className="text-slate-300 text-sm">Try again with a better disc or timing.</p>
              <div className="mt-1 text-[10px] text-slate-500">Catch chance was {Math.round(result.base * 100)}%</div>
            </>
          )}
          <div className="mt-4 flex gap-3">
            {!result.success && (
              <button onClick={() => { setPhase('ready'); setResult(null) }} className="flex-1 py-3 rounded-2xl bg-slate-800 font-semibold">Try Again</button>
            )}
            <button onClick={close} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold">
              {result.success ? 'Continue' : 'Flee'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, v }) {
  return (
    <div className="bg-slate-800/60 rounded-lg py-1">
      <div className="text-slate-400">{label}</div>
      <div className="font-bold text-white">{v}</div>
    </div>
  )
}
