import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, xpToNext } from '../store/gameStore'
import { TEAMS } from '../data/types'
import { TRACKS, TRACK_BY_ID } from '../data/tracks'
import { fmtKm } from '../utils/game'
import { Edit3 } from 'lucide-react'

const AVATARS = ['🎧', '🎤', '🎸', '🎹', '🎷', '🎻', '💃', '🕺', '👑', '🔥', '⚡', '🌙', '🎵', '💿', '🏆']
const WEEKLY_TIERS = [5, 25, 50, 100]

export default function ProfileScreen() {
  const store = useStore()
  const navigate = useNavigate()
  const p = store.profile
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(p.name)
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3000) }
  const { current, needed } = xpToNext(p)
  const dex = Object.values(store.pokedex || {}).filter(d => d.caught).length
  const s = store.stats

  const badges = [
    ['First Catch', '🎵', s.catches >= 1], ['Collector 10', '📀', dex >= 10], ['Half Dex', '💿', dex >= 23], ['Full Dex', '🏆', dex >= TRACKS.length],
    ['Shiny Hunter', '✨', Object.values(store.pokedex).some(d => d.shiny)], ['Battle Winner', '⚔️', s.battleWins >= 1], ['Raid Boss', '🥚', s.raidsWon >= 1],
    ['Static Buster', '🚨', s.rocketWins >= 1], ['Mega Master', '💠', s.megaEvolves >= 1], ['Route Walker', '🧭', s.routesCompleted >= 1],
    ['Best Friends', '💛', store.friends.some(f => f.friendXp >= 3000)], ['Trader', '⇄', s.trades >= 1], ['Walker 50km', '🚶', p.distance >= 50000], ['Level 10', '🌟', p.level >= 10],
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="glass rounded-3xl p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, #a855f7, transparent 70%)' }} />
        <div className="relative">
          <div className="text-6xl mb-1">{p.avatar}</div>
          {store.buddy && store.collection[store.buddy.uid] && <div className="text-[10px] text-pink-300">with buddy {TRACK_BY_ID[store.collection[store.buddy.uid].trackId]?.title} 🐾</div>}
          {editing ? <div className="flex gap-2 justify-center mt-1"><input value={name} onChange={e => setName(e.target.value)} className="bg-slate-800 rounded-xl px-3 py-1 text-center" /><button onClick={() => { store.setName(name); setEditing(false) }} className="px-3 py-1 bg-fuchsia-500 rounded-xl text-sm font-bold">Save</button></div>
            : <div className="flex items-center justify-center gap-2"><h2 className="text-xl font-bold">{p.name}</h2><button onClick={() => setEditing(true)}><Edit3 size={14} className="text-slate-400" /></button></div>}
          <p className="text-xs text-slate-400 mt-1">{p.title} · Level {p.level} {p.team ? `· ${TEAMS.find(t => t.id === p.team)?.icon} ${TEAMS.find(t => t.id === p.team)?.name}` : '· no team yet'}</p>
          <div className="mt-3 text-left"><div className="flex justify-between text-[10px] text-slate-400"><span>XP {p.xp}</span><span>{needed - current} to next level</span></div><div className="h-2 bg-slate-800 rounded-full"><div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 rounded-full" style={{ width: `${(current / needed) * 100}%` }} /></div></div>
        </div>
      </div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}

      <div className="glass rounded-2xl p-3"><div className="text-xs text-slate-400 mb-2">Avatar</div><div className="flex flex-wrap gap-2">{AVATARS.map(a => <button key={a} onClick={() => store.setAvatar(a)} className={`w-9 h-9 rounded-xl text-lg ${p.avatar === a ? 'bg-fuchsia-500/30 ring-1 ring-fuchsia-400' : 'bg-slate-800/60'}`}>{a}</button>)}</div></div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[['🎵 Caught', dex], ['⚔️ Wins', s.battleWins], ['🥚 Hatched', s.hatches], ['🚶 Distance', `${fmtKm(p.distance)}km`], ['✨ Stardust', p.stardust], ['🏆 League', store.league.rating]].map(([l, v]) => <div key={l} className="glass rounded-2xl p-2.5"><div className="text-[9px] text-slate-400">{l}</div><div className="font-bold text-sm">{v}</div></div>)}
      </div>

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold mb-1">🏃 Weekly fitness rewards (Adventure Sync)</h3>
        <div className="text-[11px] text-slate-400 mb-2">{store.weekly.week} · {fmtKm(store.weekly.distance)} km this week</div>
        <div className="grid grid-cols-4 gap-2">{WEEKLY_TIERS.map(km => { const reached = store.weekly.distance >= km * 1000; const claimed = store.weekly.claimed.includes(km); return <button key={km} disabled={!reached || claimed} onClick={() => say(store.claimWeekly(km) ? `${km} km reward claimed!` : 'Not yet')} className={`rounded-xl p-2 text-[10px] font-bold ${claimed ? 'bg-emerald-600/40 text-emerald-300' : reached ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}>{km} km{claimed ? ' ✓' : ''}</button> })}</div>
      </div>

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold mb-2">Choose your team</h3>
        <div className="flex gap-2">{TEAMS.map(t => <button key={t.id} onClick={() => store.setTeam(t.id)} className={`flex-1 rounded-xl p-2 text-center border ${p.team === t.id ? 'border-2' : 'border-slate-700'}`} style={p.team === t.id ? { borderColor: t.color } : {}}><div className="text-xl">{t.icon}</div><div className="text-[9px] mt-1" style={{ color: t.color }}>{t.name}</div><div className="text-[8px] text-slate-500">{t.desc}</div></button>)}</div>
      </div>

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold mb-2">Medals & badges</h3>
        <div className="grid grid-cols-4 gap-2">{badges.map(([label, icon, earned]) => <div key={label} className={`rounded-xl p-2 text-center ${earned ? 'bg-fuchsia-500/10' : 'bg-slate-800/40 opacity-40'}`}><div className="text-2xl">{icon}</div><div className="text-[8px] mt-1 text-slate-300">{label}</div></div>)}</div>
      </div>

      {(store.snapshots || []).length > 0 && (
        <div className="glass rounded-2xl p-3"><h3 className="text-sm font-bold mb-2">📷 Snapshots</h3><div className="space-y-1">{store.snapshots.slice(0, 5).map(sn => <div key={sn.id} className="flex justify-between bg-slate-800/60 rounded-lg px-2 py-1.5 text-[11px]"><span>{TRACK_BY_ID[sn.trackId]?.title} @ {sn.scene}</span>{sn.photobomb ? <button onClick={() => { const i = store.grantTrack([1, 7, 32, 38][Math.floor(Math.random() * 4)], { source: 'snapshot' }); useStore.setState(st => ({ snapshots: st.snapshots.map(x => x.id === sn.id ? { ...x, photobomb: false } : x) })); say(`Photobomb! ${TRACK_BY_ID[i.trackId].title} joined you!`) }} className="text-amber-300 font-bold">🎁 Claim photobomb</button> : <span className="text-slate-500">{new Date(sn.date).toLocaleDateString()}</span>}</div>)}</div></div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {[['/eggs', '🥚 Eggs'], ['/buddy', '🐾 Buddy'], ['/research', '📋 Research'], ['/battle?mode=raid', '🥚 Raids'], ['/friends', '👥 Friends & Party'], ['/routes', '🧭 Routes & Cells'], ['/events', '🎉 Events'], ['/collection', '📖 Pokédex']].map(([to, l]) => <button key={to} onClick={() => navigate(to)} className="glass rounded-xl p-3 text-sm font-bold text-left">{l}</button>)}
      </div>

      <div className="glass rounded-2xl p-3 flex justify-between items-center"><div><div className="text-sm font-bold">Daily free box</div><div className="text-[10px] text-slate-400">Catch streak {store.daily.catchStreak} · Stop streak {store.daily.stopStreak}</div></div><button onClick={() => say(store.claimDailyFree() ? 'Claimed: discs, berries, coins!' : 'Already claimed today')} className="px-3 py-2 rounded-xl bg-amber-500/25 text-amber-300 text-xs font-bold">Claim</button></div>

      <button onClick={() => { if (confirm('Reset all progress?')) store.reset() }} className="w-full py-3 rounded-2xl bg-red-900/40 text-red-300 font-bold text-sm">Reset Progress</button>
    </div>
  )
}
