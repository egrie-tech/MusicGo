import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACKS } from '../data/tracks'
import { VENUES } from '../data/venues'

export default function RaidsScreen() {
  const navigate = useNavigate()
  const raids = useStore(s => s.raids) || []
  const addRaid = useStore(s => s.addRaid)
  const removeRaid = useStore(s => s.removeRaid)
  const profile = useStore(s => s.profile)
  const inventory = useStore(s => s.inventory)
  const consumeItem = useStore(s => s.consumeItem)
  const catchTrack = useStore(s => s.catchTrack)

  const spawnRaid = () => {
    const boss = TRACKS[Math.floor(Math.random() * TRACKS.length)]
    const venue = VENUES[Math.floor(Math.random() * VENUES.length)]
    const raid = { id: `raid-${Date.now()}`, bossId: boss.id, venueId: venue.id, venueName: venue.name, expires: Date.now() + 60 * 60 * 1000, participants: 1 }
    addRaid(raid)
  }

  const joinRaid = (raid) => {
    if (!consumeItem('raidpass')) { alert('No raid pass'); return }
    const boss = TRACKS.find(t => t.id === raid.bossId)
    // simulate win
    const won = Math.random() < 0.7
    if (won) {
      catchTrack(boss.id, 5)
      alert(`You defeated ${boss.title} and caught it!`)
    } else {
      alert(`You lost to ${boss.title}. Try again.`)
    }
    removeRaid(raid.id)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Raids</h1>
        <button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Back</button>
      </div>

      <div className="glass rounded-2xl p-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Raid Passes: {inventory.raidpass || 0}</div>
          <div className="text-[10px] text-slate-400">Join raids to catch powerful tracks</div>
        </div>
        <button onClick={spawnRaid} className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold">Spawn Raid</button>
      </div>

      <div className="space-y-3">
        {raids.length === 0 && <div className="glass rounded-2xl p-6 text-center text-slate-400">No active raids. Spawn one!</div>}
        {raids.map(r => {
          const boss = TRACKS.find(t => t.id === r.bossId)
          const venue = VENUES.find(v => v.id === r.venueId)
          const remaining = Math.max(0, r.expires - Date.now())
          const mins = Math.floor(remaining / 60000)
          return (
            <div key={r.id} className="glass rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: `linear-gradient(135deg, hsl(${boss.hue},70%,45%), hsl(${(boss.hue+60)%360},70%,30%))` }}>🎵</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{boss.title}</div>
                  <div className="text-[10px] text-slate-400">{venue?.name} · {mins} min left</div>
                  <div className="text-[10px] text-amber-400">Raid Boss · {boss.rarity}</div>
                </div>
                <button onClick={() => joinRaid(r)} className="px-3 py-2 rounded-xl bg-red-600 text-xs font-bold">Join</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
