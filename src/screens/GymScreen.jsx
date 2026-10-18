import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACK_BY_ID } from '../data/tracks'
import { TEAMS } from '../data/types'
import { fmtTimeLeft } from '../utils/game'
import TrackArt from '../components/TrackArt'

export default function GymScreen() {
  const { poiId } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const poi = (store.pois || []).find(p => p.id === poiId)
  const [loot, setLoot] = useState(false)
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3000) }
  if (!poi) return <div className="p-6 text-slate-400">Gym not found. <button className="text-fuchsia-400" onClick={() => navigate('/map')}>Back</button></div>
  const gym = poi.gym || { team: null, defenders: [] }
  const team = TEAMS.find(t => t.id === gym.team)
  const cooldown = Math.max(0, (poi.lastSpin || 0) + 5 * 60 * 1000 - Date.now())
  const myTeam = store.profile.team
  const mine = gym.team && gym.team === myTeam
  const defenders = (gym.defenders || []).map(u => store.collection[u]).filter(Boolean)
  const badgeLvl = (poi.badge?.spins || 0) + (poi.badge?.battles || 0) * 2 >= 30 ? 'Gold' : (poi.badge?.spins || 0) >= 10 ? 'Silver' : (poi.badge?.spins || 0) >= 3 ? 'Bronze' : 'None'

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Back</button>
      <div className="glass rounded-3xl p-6 text-center" style={{ borderTop: `4px solid ${team?.color || '#64748b'}` }}>
        <div className="text-6xl">🏟️</div>
        <h1 className="text-xl font-bold mt-2">{poi.name}</h1>
        <p className="text-xs text-slate-400">Venue Gym · Badge: {badgeLvl} ({poi.badge?.spins || 0} spins · {poi.badge?.battles || 0} battles)</p>
        <p className="text-sm mt-1" style={{ color: team?.color }}>{team ? `${team.icon} ${team.name} · Prestige ${gym.points || 0}` : 'Unclaimed gym'}</p>
        {gym.owner && <p className="text-[10px] text-slate-500">Leader: {gym.owner}</p>}
      </div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}

      <button onClick={() => { const r = store.spinPoi(poi.id); if (r && !r.cooldown) { setLoot(true); say('Gym disc spun: bonus items + raid pass chance!') } else say('Disc on cooldown') }} disabled={cooldown > 0} className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 font-bold disabled:opacity-40">{cooldown > 0 ? `Disc cooldown ${fmtTimeLeft(cooldown)}` : 'Spin Gym Photo Disc'}</button>
      {loot && <div className="text-[11px] text-slate-400 text-center">Items added to your bag. Gym spins also charge your daily stop streak.</div>}

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold mb-2">Defenders {defenders.length ? `(${defenders.length}/6)` : ''} · Motivation decays over time — feed berries!</h3>
        {defenders.length === 0 && <p className="text-xs text-slate-400">No defenders. {gym.team ? 'Enemy defenders are simulated in battle.' : 'Win the gym battle to claim and place a defender.'}</p>}
        <div className="space-y-2">
          {defenders.map(inst => { const t = TRACK_BY_ID[inst.trackId]; return (
            <div key={inst.uid} className="flex items-center gap-3 bg-slate-800/60 rounded-xl p-2">
              <TrackArt track={t} inst={inst} size="md" />
              <div className="flex-1"><div className="text-xs font-bold">{t.title}</div><div className="text-[10px] text-slate-400">CP {inst.cp} · HP {inst.hp}/{inst.maxHp} · ♥ motivation {Math.max(20, 100 - Math.floor((Date.now() - inst.caughtAt) / 3600000))}%</div></div>
              <button onClick={() => say(store.feedDefender(poi.id, inst.uid) ? 'Fed a berry! Motivation restored (+25 XP)' : 'No berries')} className="px-2 py-1.5 rounded-lg bg-pink-600 text-[10px] font-bold">🍓 Feed</button>
              <button onClick={() => { store.updatePoi(poi.id, { gym: { ...gym, defenders: gym.defenders.filter(u => u !== inst.uid) } }); const c = store.claimGymCoins(poi.id); say(`Defender returned! +${c} coins (max 50/day)`) }} className="px-2 py-1.5 rounded-lg bg-amber-600 text-[10px] font-bold">Return</button>
            </div>) })}
        </div>
        {(!gym.team || mine) && (
          <div className="mt-3">
            <div className="text-[10px] text-slate-400 mb-1">Place one of your tracks to defend:</div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {Object.values(store.collection).slice(0, 10).map(inst => { const t = TRACK_BY_ID[inst.trackId]; return <button key={inst.uid} onClick={() => say(store.gymDefend(poi.id, inst.uid) ? `${t.title} is defending!` : 'Cannot place (gym full, wrong team, or pick a team in Profile)')} className="shrink-0 bg-slate-800 rounded-xl px-2 py-1.5 text-[10px]">{t.title} · {inst.cp}</button> })}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => navigate(`/battle?mode=gym&poiId=${poi.id}`)} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-fuchsia-500 font-bold">⚔️ Battle this Gym</button>
      {!myTeam && <p className="text-[11px] text-amber-300 text-center">Choose Team Instinct, Mystic or Valor in your Profile to claim gyms.</p>}
    </div>
  )
}
