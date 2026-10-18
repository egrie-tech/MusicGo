import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { EVENTS, COMMUNITY_DAYS, activeEvents, activeCommunityDay } from '../data/events'
import { TRACK_BY_ID } from '../data/tracks'

const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function EventsScreen() {
  const navigate = useNavigate()
  const store = useStore()
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3000) }
  const active = activeEvents(); const cd = activeCommunityDay()
  const now = Date.now()

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">🎉 Events</h1><button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Map</button></div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}

      {cd && (
        <div className="rounded-3xl p-4 bg-gradient-to-br from-amber-500/30 to-fuchsia-500/20 border border-amber-400/40">
          <div className="text-lg font-black">🌟 {cd.name} — LIVE</div>
          <div className="text-xs text-slate-200">Featured: {TRACK_BY_ID[cd.trackId]?.title} everywhere · {cd.shinyMult}× shiny odds · exclusive move {cd.moveBonus} · ends {fmtDate(cd.end)}</div>
          <button onClick={() => navigate('/map')} className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs">Go catch it!</button>
        </div>
      )}

      <h3 className="text-sm font-bold">Active events</h3>
      {active.length === 0 && <div className="glass rounded-2xl p-4 text-slate-400 text-sm">No active events right now.</div>}
      {active.map(e => (
        <div key={e.id} className="glass rounded-2xl p-4" style={{ borderLeft: `4px solid ${e.color}` }}>
          <div className="font-bold">{e.name}</div>
          <div className="text-[11px] text-slate-400">{e.desc}</div>
          <div className="text-[10px] text-slate-500">{fmtDate(e.start)} → {fmtDate(e.end)} · spawn ×{e.bonuses.spawnMult} · catch XP ×{e.bonuses.catchXp}</div>
          <button onClick={() => say(store.claimEventFree(e.id) ? 'Free event box: Incense + Lucky Egg!' : 'Already claimed today')} className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500/25 text-amber-300 text-[11px] font-bold">🎁 Free daily event items</button>
        </div>
      ))}

      <h3 className="text-sm font-bold">Coming up</h3>
      {[...EVENTS.filter(e => e.start > now), ...COMMUNITY_DAYS.filter(c => c.end > now).map(c => ({ id: c.id, name: c.name, start: c.start, end: c.end, desc: `Community Day: ${TRACK_BY_ID[c.trackId]?.title} · exclusive move ${c.moveBonus}`, color: '#f59e0b' }))].sort((a, b) => a.start - b.start).map(e => (
        <div key={e.id} className="glass rounded-2xl p-3 opacity-80"><div className="font-bold text-sm">{e.name}</div><div className="text-[11px] text-slate-400">{e.desc}</div><div className="text-[10px] text-slate-500">Starts {fmtDate(e.start)}</div></div>
      ))}

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold mb-1">Season snapshot</h3>
        <p className="text-[11px] text-slate-400">Weather currently boosts {store.weather?.boost?.join(' & ')} spawns, CP and catch rates. Seasonal Research rotates monthly in the Research tab.</p>
        <button onClick={() => navigate('/research')} className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 text-[11px] font-bold">Open Research</button>
      </div>
    </div>
  )
}
