import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { ITEM_BY_ID, LURES } from '../data/items'
import { fmtTimeLeft } from '../utils/game'

export default function StopScreen() {
  const { poiId } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const poi = (store.pois || []).find(p => p.id === poiId)
  const [loot, setLoot] = useState(null)
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3000) }
  if (!poi) return <div className="p-6 text-slate-400">Stop not found. <button className="text-fuchsia-400" onClick={() => navigate('/map')}>Back to map</button></div>
  const cooldown = Math.max(0, (poi.lastSpin || 0) + 5 * 60 * 1000 - Date.now())
  const lured = poi.lure && poi.lure.until > Date.now()

  const spin = () => {
    const r = store.spinPoi(poi.id)
    if (!r) return
    if (r.cooldown) { say('Disc on cooldown — 5 min between spins'); return }
    setLoot(r); say(`Spun! ${r.researchTask ? 'New Field Research added.' : ''}`)
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Back</button>
      <div className="glass rounded-3xl p-6 text-center" style={{ borderTop: '4px solid #0ea5e9' }}>
        <div className={`text-6xl ${cooldown ? 'opacity-40 grayscale' : 'spin-slow inline-block'}`}>💿</div>
        <h1 className="text-xl font-bold mt-2">{poi.name}</h1>
        <p className="text-xs text-slate-400">Amplifier Stop · 📮 {poi.postcardRegion} postcards · Badge: {poi.badge?.spins || 0} spins, {poi.badge?.visits || 0} visits</p>
        {lured && <p className="text-xs text-fuchsia-300 mt-1">🎤 Lure active by {poi.lure.by} — {fmtTimeLeft(poi.lure.until - Date.now())} left</p>}
        {poi.grunt && <p className="text-xs text-red-400 mt-1">🚨 Team Static grunt lurking here!</p>}
      </div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}
      <button onClick={spin} disabled={cooldown > 0} className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-fuchsia-500 font-bold disabled:opacity-40">{cooldown > 0 ? `Cooldown ${fmtTimeLeft(cooldown)}` : 'Spin Photo Disc'}</button>

      {loot && !loot.cooldown && (
        <div className="glass rounded-2xl p-3">
          <div className="text-sm font-bold mb-2">You got:</div>
          <div className="flex gap-2 flex-wrap">{loot.loot.map((id, i) => <span key={i} className="bg-slate-800 rounded-xl px-3 py-2 text-sm">{ITEM_BY_ID[id]?.icon} {ITEM_BY_ID[id]?.name}</span>)}
            {loot.gift && <span className="bg-slate-800 rounded-xl px-3 py-2 text-sm">🎁 Gift</span>}
            {loot.egg && <span className="bg-slate-800 rounded-xl px-3 py-2 text-sm">🥚 Egg!</span>}
            {loot.postcard && <span className="bg-slate-800 rounded-xl px-3 py-2 text-sm">📮 Postcard</span>}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">+50 XP · daily stop streak {store.daily.stopStreak}</p>
        </div>
      )}

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold mb-2">Place a Lure Module (30 min)</h3>
        <div className="flex gap-2 flex-wrap">
          {LURES.map(l => <button key={l.id} onClick={() => say(store.placeLure(poi.id, l.id) ? `${l.name} placed! Spawns will gather here.` : `No ${l.name} in your bag`)} className="px-3 py-2 rounded-xl bg-slate-800 text-xs">{l.icon} {l.name} ×{store.inventory[l.id] || 0}</button>)}
        </div>
      </div>
      {poi.grunt && <button onClick={() => navigate('/battle?mode=rocket&who=grunt')} className="w-full py-3 rounded-2xl bg-red-600 font-bold">🚨 Challenge Team Static Grunt</button>}
      <button onClick={() => navigate('/routes')} className="w-full py-3 rounded-2xl bg-slate-800 font-bold text-sm">🧭 Start a Route from here</button>
    </div>
  )
}
