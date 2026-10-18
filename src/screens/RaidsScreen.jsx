import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACK_BY_ID } from '../data/tracks'
import TrackArt from '../components/TrackArt'

export default function RaidsScreen() {
  const navigate = useNavigate()
  const store = useStore()
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">🥚 Raids</h1><button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Map</button></div>
      <div className="glass rounded-2xl p-3 text-xs">Raid Passes 🎫 {store.inventory.raidpass || 0} · Premium 🌟 {store.inventory.premiumpass || 0}<div className="text-slate-400 mt-1">Win the raid battle, then catch the boss with boosted odds. Shadow raids rescue Shadow tracks; Max raids feature Gigantamax bosses.</div></div>
      <div className="space-y-2">
        {(store.raids || []).length === 0 && <div className="glass rounded-2xl p-5 text-center text-slate-400">No raids loaded — open Battle to generate today's raids.</div>}
        {(store.raids || []).map(r => { const b = TRACK_BY_ID[r.bossId]; return (
          <div key={r.id} className="glass rounded-2xl p-3 flex items-center gap-3">
            <TrackArt track={b} size="lg" />
            <div className="flex-1"><div className="font-bold text-sm">{b?.title} · {r.tier} {r.type !== 'standard' ? r.type : ''}</div><div className="text-[10px] text-slate-400">{r.poiName} · {Math.max(0, Math.floor((r.expires - Date.now()) / 60000))} min left</div></div>
            <button onClick={() => navigate(`/battle?mode=raid&raidId=${r.id}`)} className="px-3 py-2 rounded-xl bg-red-500 text-xs font-bold">Battle</button>
          </div>) })}
      </div>
      <button onClick={() => navigate('/battle?mode=raid')} className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-fuchsia-500 font-bold">Open Raid Lobby</button>
    </div>
  )
}
