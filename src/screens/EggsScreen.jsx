import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACK_BY_ID } from '../data/tracks'
import { fmtKm } from '../utils/game'

export default function EggsScreen() {
  const navigate = useNavigate()
  const store = useStore()
  const [placeFor, setPlaceFor] = useState(null)
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3000) }
  const walk = (m) => { const h = store.addDistance(m); say(h?.length ? `🥚 Hatched ${TRACK_BY_ID[h[0].trackId]?.title}! Check your Collection` : `Walked ${fmtKm(m)} km (Adventure Sync)`) }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">🥚 Eggs & Incubators</h1><button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Map</button></div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}
      <div className="glass rounded-2xl p-3">
        <div className="text-sm font-bold">Adventure Sync is ON</div>
        <div className="text-[11px] text-slate-400">Lifetime distance {(fmtKm(store.profile.distance))} km · this week {fmtKm(store.weekly.distance)} km · Eggs hatched: {store.hatched}</div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => walk(500)} className="flex-1 py-2 rounded-xl bg-emerald-600 text-xs font-bold">Simulate walk 0.5 km</button>
          <button onClick={() => walk(2000)} className="flex-1 py-2 rounded-xl bg-emerald-700 text-xs font-bold">Simulate walk 2 km</button>
        </div>
      </div>

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold mb-2">Incubators</h3>
        <div className="flex gap-2 flex-wrap">
          {store.incubators.map(i => { const busy = store.eggs.some(e => e.incubatorId === i.id); return <div key={i.id} className={`rounded-xl px-3 py-2 text-center ${busy ? 'bg-fuchsia-500/20 ring-1 ring-fuchsia-400' : 'bg-slate-800/60'}`}><div className="text-xl">{i.type === 'Turbo' ? '⚙️' : '🥚'}</div><div className="text-[10px] font-bold">{i.type}</div><div className="text-[9px] text-slate-400">{busy ? 'in use' : i.uses > 9000 ? '∞ uses' : `${i.uses} uses`}{i.type === 'Turbo' ? ' · 1.5× speed' : ''}</div></div> })}
          <button onClick={() => say(store.buyIncubator('basic') ? 'Incubator added' : 'Need coins or an Incubator item')} className="rounded-xl px-3 py-2 bg-slate-800 text-[10px]">＋ Basic<br />(200c)</button>
          <button onClick={() => say(store.buyIncubator('super') ? 'Turbo Incubator added' : 'Need coins')} className="rounded-xl px-3 py-2 bg-slate-800 text-[10px]">＋ Turbo<br />(300c)</button>
        </div>
      </div>

      <div className="space-y-3">
        {(store.eggs || []).length === 0 && <div className="glass rounded-2xl p-6 text-center text-slate-400">No eggs. Spin stops & open gifts to find 2/5/7/10/12 km eggs.</div>}
        {(store.eggs || []).map(e => { const pct = Math.min(100, ((e.walkedM || 0) / e.distanceM) * 100); const ready = (e.walkedM || 0) >= e.distanceM; return (
          <div key={e.id} className="glass rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🥚</div>
              <div className="flex-1">
                <div className="font-bold text-sm">{e.type} Egg {ready ? '· READY!' : ''}</div>
                <div className="text-[10px] text-slate-400">{fmtKm(e.walkedM || 0)} / {fmtKm(e.distanceM)} km {e.incubatorId ? '· incubating' : '· not incubating'}</div>
                <div className="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${pct}%` }} /></div>
              </div>
              {ready ? <button onClick={() => { const inst = store.hatchEgg(e.id); say(`🎉 Hatched ${TRACK_BY_ID[inst?.trackId]?.title}! +500 XP, candy bonus`) }} className="px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold">Hatch!</button>
                : !e.incubatorId ? <button onClick={() => setPlaceFor(placeFor === e.id ? null : e.id)} className="px-3 py-2 rounded-xl bg-fuchsia-500 text-xs font-bold">Incubate</button> : <span className="text-[10px] text-slate-400">walking…</span>}
            </div>
            {placeFor === e.id && <div className="mt-2 flex gap-2 flex-wrap">{store.incubators.filter(i => i.uses > 0 && !store.eggs.some(x => x.incubatorId === i.id)).map(i => <button key={i.id} onClick={() => { store.placeEgg(e.id, i.id); setPlaceFor(null) }} className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs">{i.type} ({i.uses > 9000 ? '∞' : i.uses})</button>)}</div>}
          </div>) })}
      </div>
      <p className="text-[10px] text-slate-500 text-center">Eggs also progress from real GPS movement on the Map. Weekly fitness rewards are in your Profile.</p>
    </div>
  )
}
