import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACKS } from '../data/tracks'

const TASKS = [
  { id: 'r1', title: 'Catch 3 tracks', desc: 'Catch 3 wild tracks', progress: 0, target: 3, reward: { coins: 200, xp: 100, item: 'ball', qty: 5 } },
  { id: 'r2', title: 'Walk 2 km', desc: 'Walk 2 kilometers', progress: 0, target: 2000, reward: { coins: 300, xp: 150, stardust: 100 } },
  { id: 'r3', title: 'Win a battle', desc: 'Win 1 battle', progress: 0, target: 1, reward: { coins: 500, xp: 200, item: 'great', qty: 2 } },
  { id: 'r4', title: 'Hatch an egg', desc: 'Hatch 1 egg', progress: 0, target: 1, reward: { coins: 400, xp: 250, stardust: 150 } },
  { id: 'r5', title: 'Evolve a track', desc: 'Evolve 1 track', progress: 0, target: 1, reward: { coins: 600, xp: 300, item: 'ultra', qty: 1 } },
]

export default function ResearchScreen() {
  const navigate = useNavigate()
  const research = useStore(s => s.research) || []
  const addResearch = useStore(s => s.addResearch)
  const completeResearch = useStore(s => s.completeResearch)
  const profile = useStore(s => s.profile)

  const startTask = (t) => {
    if (research.find(r => r.id === t.id)) return
    addResearch({ ...t, startedAt: Date.now() })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Research</h1>
        <button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Back</button>
      </div>

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-semibold mb-2">Available Tasks</h3>
        <div className="space-y-2">
          {TASKS.map(t => {
            const active = research.find(r => r.id === t.id)
            return (
              <div key={t.id} className="bg-slate-800/60 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{t.title}</div>
                    <div className="text-[10px] text-slate-400">{t.desc}</div>
                  </div>
                  {!active ? (
                    <button onClick={() => startTask(t)} className="px-3 py-1 rounded-xl bg-fuchsia-500 text-xs font-bold">Start</button>
                  ) : (
                    <button onClick={() => completeResearch(t.id)} className="px-3 py-1 rounded-xl bg-green-600 text-xs font-bold">Claim</button>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Reward: {t.reward.coins} coins, {t.reward.xp} XP{t.reward.item ? `, ${t.reward.qty}x ${t.reward.item}` : ''}{t.reward.stardust ? `, ${t.reward.stardust} stardust` : ''}</div>
              </div>
            )
          })}
        </div>
      </div>

      {research.length > 0 && (
        <div className="glass rounded-2xl p-3">
          <h3 className="text-sm font-semibold mb-2">Active ({research.length})</h3>
          {research.map(r => (
            <div key={r.id} className="bg-slate-800/60 rounded-xl p-2 mb-1 text-xs">
              {r.title} — {r.desc}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
