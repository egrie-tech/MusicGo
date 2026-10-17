import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACKS } from '../data/tracks'
import { Egg, Play } from 'lucide-react'

const EGG_TYPES = [
  { id: '2km', name: '2 km Egg', distance: 2000, icon: '🥚', pool: [1,2,7,9,29,32,33,38,42] },
  { id: '5km', name: '5 km Egg', distance: 5000, icon: '🥚', pool: [5,8,10,12,14,17,19,27,28,31,39,41,43,44] },
  { id: '10km', name: '10 km Egg', distance: 10000, icon: '🥚', pool: [6,11,13,15,16,18,20,21,22,23,30,34,35,36,37,40,45] },
]

export default function EggsScreen() {
  const navigate = useNavigate()
  const eggs = useStore(s => s.eggs) || []
  const incubators = useStore(s => s.incubators) || []
  const addEgg = useStore(s => s.addEgg)
  const placeEgg = useStore(s => s.placeEgg)
  const profile = useStore(s => s.profile)
  const [selectedEgg, setSelectedEgg] = useState(null)
  const [selectedInc, setSelectedInc] = useState(null)

  const collectEgg = () => {
    const type = EGG_TYPES[Math.floor(Math.random() * EGG_TYPES.length)]
    const rewardTrackId = type.pool[Math.floor(Math.random() * type.pool.length)]
    const egg = { id: `egg-${Date.now()}`, type: type.id, name: type.name, icon: type.icon, distanceNeeded: type.distance, distanceWalked: 0, rewardTrackId, incubator: null }
    addEgg(egg)
  }

  const getType = (id) => EGG_TYPES.find(t => t.id === id)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Eggs</h1>
        <button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Back</button>
      </div>

      <div className="glass rounded-2xl p-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Walk to hatch</div>
          <div className="text-[10px] text-slate-400">Total distance: {((profile.distance||0)/1000).toFixed(2)} km</div>
        </div>
        <button onClick={collectEgg} className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold">Find Egg</button>
      </div>

      <div className="space-y-3">
        {eggs.length === 0 && <div className="glass rounded-2xl p-6 text-center text-slate-400">No eggs. Tap "Find Egg" to get one!</div>}
        {eggs.map(e => {
          const t = getType(e.type)
          const pct = Math.min(100, ((e.distanceWalked||0) / (e.distanceNeeded||1)) * 100)
          const ready = (e.distanceWalked||0) >= (e.distanceNeeded||1)
          return (
            <div key={e.id} className="glass rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{e.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{e.name}</div>
                  <div className="text-[10px] text-slate-400">{((e.distanceWalked||0)/1000).toFixed(2)} / {(e.distanceNeeded/1000).toFixed(1)} km</div>
                  <div className="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  {ready && <div className="text-xs text-green-400 mt-1">Ready to hatch!</div>}
                </div>
                {!e.incubator ? (
                  <button onClick={() => { setSelectedEgg(e.id) }} className="px-3 py-2 rounded-xl bg-fuchsia-500 text-xs font-bold">Place</button>
                ) : (
                  <span className="text-xs text-slate-400">Incubating</span>
                )}
              </div>
              {selectedEgg === e.id && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {incubators.filter(i => i.uses > 0).map(i => (
                    <button key={i.id} onClick={() => { placeEgg(e.id, i.id); setSelectedEgg(null) }}
                      className="px-3 py-1 rounded-xl bg-slate-800 text-xs">{i.type} ({i.uses})</button>
                  ))}
                  <button onClick={() => setSelectedEgg(null)} className="px-3 py-1 rounded-xl bg-slate-700 text-xs">Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-semibold mb-2">Incubators</h3>
        <div className="flex gap-2">
          {incubators.map(i => (
            <div key={i.id} className="bg-slate-800/60 rounded-xl px-3 py-2 text-center">
              <div className="text-xl">🥚</div>
              <div className="text-[10px]">{i.type}</div>
              <div className="text-[9px] text-slate-400">{i.uses} uses</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
