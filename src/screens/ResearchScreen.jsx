import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { SPECIAL_RESEARCH, TIMED_RESEARCH, SEASONAL_RESEARCH } from '../data/research'

function rewardText(r = {}) {
  const bits = []
  if (r.xp) bits.push(`${r.xp} XP`); if (r.coins) bits.push(`${r.coins} coins`); if (r.stardust) bits.push(`${r.stardust} dust`)
  if (r.item) bits.push(`${r.qty || 1}× ${r.item}`); if (r.trackId) bits.push('★ track encounter')
  return bits.join(' · ') || '—'
}

export default function ResearchScreen() {
  const navigate = useNavigate()
  const store = useStore()
  const [tab, setTab] = useState('field')
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3000) }
  const month = new Date().getMonth()
  const seasonal = SEASONAL_RESEARCH.find(s => s.months.includes(month)) || SEASONAL_RESEARCH[0]
  const timed = TIMED_RESEARCH[0]

  useEffect(() => {
    if (store.research.specialStart == null && !store.research.specialDone) store.initCampaign('special', SPECIAL_RESEARCH)
    if (store.research.timedStart == null && !store.research.timedDone) store.initCampaign('timed', timed)
    if (store.research.seasonalStart == null && !store.research.seasonalDone) store.initCampaign('seasonal', seasonal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const campaign = (kind, camp) => {
    const p = store.campaignProgress(kind, camp)
    if (p.done || store.research[`${kind}Done`]) return <div className="glass rounded-2xl p-5 text-center">🏆 <b>{camp.title}</b> complete! All rewards claimed.</div>
    const step = camp.steps[p.stepIdx]
    const allDone = p.tasks.every(t => t.progress >= t.target) || p.tasks.length === 0
    return (
      <div className="glass rounded-2xl p-4 space-y-3">
        <div><div className="font-bold">{camp.title}</div><div className="text-[11px] text-slate-400">{camp.desc || `Step ${p.stepIdx + 1} of ${camp.steps.length}`}</div></div>
        <div className="bg-slate-800/60 rounded-xl p-3">
          <div className="text-sm font-semibold mb-2">{step.text}</div>
          {p.tasks.length === 0 && <div className="text-xs text-slate-400">Final reward is ready to claim!</div>}
          {p.tasks.map((t, i) => (
            <div key={i} className="mb-2"><div className="flex justify-between text-[11px]"><span>{t.type}{t.genre ? ` (${t.genre})` : ''}</span><span>{t.progress}/{t.target}</span></div><div className="h-1.5 bg-slate-900 rounded"><div className="h-full bg-fuchsia-500 rounded" style={{ width: `${(t.progress / t.target) * 100}%` }} /></div></div>
          ))}
          <div className="text-[10px] text-amber-300">Reward: {rewardText(step.reward)}</div>
          <button disabled={!allDone} onClick={() => say(store.claimCampaignStep(kind, camp) ? 'Reward claimed! Next step unlocked.' : 'Not finished yet')} className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 font-bold text-xs disabled:opacity-40">Claim step reward</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">📋 Research</h1><button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Map</button></div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[['field', '🗺️ Field'], ['special', '📖 Special'], ['timed', '⏱️ Timed'], ['seasonal', '🍂 Seasonal'], ['daily', '📅 Daily']].map(([id, l]) => <button key={id} onClick={() => setTab(id)} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold ${tab === id ? 'bg-fuchsia-500' : 'bg-slate-800'}`}>{l}</button>)}
      </div>

      {tab === 'field' && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400">Spin Amplifier Stops to receive up to 3 Field Research tasks. Progress tracks automatically from your play.</p>
          {(store.research.field || []).length === 0 && <div className="glass rounded-2xl p-5 text-center text-slate-400">No active tasks — spin a stop disc!</div>}
          {(store.research.field || []).map(t => { const prog = store.taskProgress(t); return (
            <div key={t.uid} className="glass rounded-2xl p-3">
              <div className="flex justify-between gap-2"><div><div className="text-sm font-bold">{t.text}</div><div className="text-[10px] text-amber-300">Reward: {rewardText(t.reward)}</div></div>
                <div className="flex gap-1 shrink-0">
                  <button disabled={prog < t.target} onClick={() => say(store.claimFieldTask(t.uid) ? 'Field Research reward claimed!' : 'Not complete')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-[11px] font-bold disabled:opacity-40">Claim</button>
                  <button onClick={() => store.deleteFieldTask(t.uid)} className="px-2 py-1.5 rounded-lg bg-slate-800 text-[11px]">🗑</button>
                </div></div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-2"><span>Progress</span><span>{prog}/{t.target}</span></div>
              <div className="h-1.5 bg-slate-800 rounded"><div className="h-full bg-fuchsia-500 rounded" style={{ width: `${(prog / t.target) * 100}%` }} /></div>
            </div>) })}
        </div>
      )}
      {tab === 'special' && campaign('special', SPECIAL_RESEARCH)}
      {tab === 'timed' && (<div className="space-y-2"><p className="text-[11px] text-slate-400">⏱️ {timed.title} — resets monthly. Finish before the window closes!</p>{campaign('timed', timed)}</div>)}
      {tab === 'seasonal' && (<div className="space-y-2"><p className="text-[11px] text-slate-400">🍂 Current season research rotates with the calendar.</p>{campaign('seasonal', seasonal)}</div>)}
      {tab === 'daily' && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="font-bold">Daily challenges & streaks</div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-slate-800/60 rounded-xl p-3"><div className="text-lg font-bold text-orange-400">🔥 {store.daily.catchStreak}</div>Catch streak (days)</div>
            <div className="bg-slate-800/60 rounded-xl p-3"><div className="text-lg font-bold text-sky-400">💿 {store.daily.stopStreak}</div>Stop streak (days)</div>
          </div>
          <p className="text-[11px] text-slate-400">First catch and first spin each day extend your streaks. Spin on day 1 of a streak for bonus drops!</p>
          <button onClick={() => say(store.claimDailyFree() ? 'Daily free box: 5 discs, 2 razz, 100 coins!' : 'Already claimed today')} className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold text-sm">🎁 Claim free daily box</button>
          <div className="text-[11px] text-slate-400">Lifetime: {store.stats.catches} catches · {store.stats.spins} spins · {store.stats.battleWins} battle wins · {store.stats.hatches} hatches</div>
        </div>
      )}
    </div>
  )
}
