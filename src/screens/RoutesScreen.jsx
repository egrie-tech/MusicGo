import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { ROUTES, CELL_GOAL } from '../data/routes'
import { fmtKm } from '../utils/game'

export default function RoutesScreen() {
  const navigate = useNavigate()
  const store = useStore()
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3500) }
  const rs = store.routeState
  const active = ROUTES.find(r => r.id === rs.activeId)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">🧭 Routes & Crescendo Cells</h1><button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Map</button></div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}
      <div className="glass rounded-2xl p-3">
        <div className="flex justify-between text-sm"><span>🔷 Crescendo Cells</span><b>{rs.cells} / {CELL_GOAL}</b></div>
        <div className="h-2 bg-slate-800 rounded-full mt-1"><div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, (rs.cells / CELL_GOAL) * 100)}%` }} /></div>
        <button disabled={rs.cells < CELL_GOAL} onClick={() => { const i = store.claimCellReward(); say(i ? '🎼 The Maestro track "Crescendo" joined you!' : 'Not enough cells') }} className="mt-2 w-full py-2.5 rounded-xl bg-cyan-600 font-bold text-xs disabled:opacity-40">Summon Crescendo ({CELL_GOAL} cells)</button>
        <p className="text-[10px] text-slate-500 mt-1">Follow routes and reach waypoints to discover Crescendo Cells. Completed routes: {rs.completed.length}</p>
      </div>

      {active && (
        <div className="glass rounded-2xl p-4 border border-cyan-500/40">
          <div className="font-bold">▶ On route: {active.name}</div>
          <div className="text-[11px] text-slate-400">{fmtKm(rs.walkedM)} / {fmtKm(active.distanceM)} km · waypoint {rs.waypoint}/{active.waypoints.length}</div>
          <div className="h-2 bg-slate-800 rounded-full mt-1"><div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, (rs.walkedM / active.distanceM) * 100)}%` }} /></div>
          <div className="mt-2 space-y-1">{active.waypoints.map((w, i) => <div key={i} className={`text-[11px] ${i < rs.waypoint ? 'text-emerald-400' : 'text-slate-500'}`}>{i < rs.waypoint ? '✓' : '○'} {w}</div>)}</div>
          {rs.lastEvent && <div className="text-[11px] text-cyan-300 mt-2">{rs.lastEvent}</div>}
          <div className="flex gap-2 mt-3">
            <button onClick={() => { store.addDistance(500); say(store.routeState.lastEvent || 'Walked 0.5 km along the route') }} className="flex-1 py-2 rounded-xl bg-emerald-600 text-xs font-bold">🚶 Walk 0.5 km</button>
            <button onClick={() => store.stopRoute()} className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-bold">Stop route</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {ROUTES.map(r => { const done = rs.completed.includes(r.id); return (
          <div key={r.id} className="glass rounded-2xl p-3">
            <div className="flex justify-between"><div><div className="font-bold text-sm">{r.name} {done && '✓'}</div><div className="text-[10px] text-slate-400">{r.desc}</div></div><span className="text-[10px] text-cyan-300">{fmtKm(r.distanceM)} km · 🔷~{r.cells}</span></div>
            <div className="text-[10px] text-slate-500 mt-1">Waypoints: {r.waypoints.slice(0, 4).join(' → ')}{r.waypoints.length > 4 ? ' → …' : ''}</div>
            <div className="text-[10px] text-amber-300">Reward: {r.reward.xp} XP · {r.reward.coins} coins · {r.reward.stardust} dust</div>
            <button onClick={() => { store.startRoute(r.id); say(`Route started: ${r.name}. Walk (real GPS or simulate) to progress!`) }} className="mt-2 w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 font-bold text-xs">Follow Route</button>
          </div>) })}
      </div>
    </div>
  )
}
