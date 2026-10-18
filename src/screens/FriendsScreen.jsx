import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, friendStage } from '../store/gameStore'
import { TRACK_BY_ID } from '../data/tracks'
import { FRIEND_STAGES } from '../data/types'
import { FRIEND_POOL } from '../data/npcs'
import { REGIONS } from '../data/pois'
import TrackArt from '../components/TrackArt'

export default function FriendsScreen() {
  const navigate = useNavigate()
  const store = useStore()
  const [note, setNote] = useState(null)
  const [tradeFriend, setTradeFriend] = useState(null)
  const [tradeUid, setTradeUid] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3500) }
  const earnedRegions = [...new Set((store.postcards || []).map(p => p.region))]
  const claimPostcards = (n, reward, label) => say(store.claimOnce(`postcards-${n}`, reward) ? `${label} claimed!` : `Collect postcards from ${n} regions first (have ${earnedRegions.length})`)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">👥 Friends & Party</h1><button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Map</button></div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}
      <div className="glass rounded-2xl p-3 flex justify-between text-xs"><span>🎁 Gifts held: <b>{store.giftsHeld}</b></span><span>Sent {store.stats.giftsSent} · Opened {store.stats.giftsOpened}</span><span>Trades {store.stats.trades}</span></div>

      <section>
        <h3 className="text-sm font-bold mb-2">Add friends</h3>
        <div className="flex gap-2 flex-wrap">{FRIEND_POOL.filter(f => !store.friends.some(x => x.name === f.name)).map(f => <button key={f.name} onClick={() => { store.addFriend({ id: `npc-${f.name}`, ...f }); say(`${f.name} added! Send them a gift.`) }} className="px-3 py-2 rounded-xl bg-slate-800 text-xs">{f.avatar} {f.name} · Lv{f.level} ＋</button>)}</div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold">Your friends</h3>
        {(store.friends || []).length === 0 && <div className="glass rounded-2xl p-5 text-center text-slate-400">No friends yet — add some above!</div>}
        {(store.friends || []).map(f => { const st = FRIEND_STAGES[friendStage(f.friendXp)]; return (
          <div key={f.id} className="glass rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{f.avatar}</span>
              <div className="flex-1"><div className="text-sm font-bold">{f.name} <span className="text-[10px]" style={{ color: st.color }}>♥ {st.name}</span></div><div className="text-[10px] text-slate-400">Lv {f.level} · friendship XP {f.friendXp} · trade discount {Math.round(st.bonus * 100)}%</div></div>
              <button onClick={() => { setTradeFriend(f.id); setTradeUid(null) }} className="px-2 py-1.5 rounded-lg bg-violet-600 text-[10px] font-bold">⇄ Trade</button>
              <button onClick={() => say(store.openGift(f.id) ? `Opened gift from ${f.name}: items + 200 XP + postcard!` : 'Already opened today')} className="px-2 py-1.5 rounded-lg bg-pink-600 text-[10px] font-bold">🎁 Open</button>
              <button onClick={() => say(store.sendGift(f.id) ? `Gift sent to ${f.name}! +100 XP` : 'No gift to send (spin stops) or already sent today')} disabled={f.giftSentDay === new Date().toISOString().slice(0, 10)} className="px-2 py-1.5 rounded-lg bg-amber-600 text-[10px] font-bold disabled:opacity-40">Send</button>
            </div>
            {tradeFriend === f.id && (
              <div className="mt-3 bg-slate-900/60 rounded-xl p-2">
                <div className="text-[11px] font-bold mb-1">Trade with {f.name} — pick one of your tracks (special trades: legendary/shiny, 1/day, distance ≤ 100 km simulated)</div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {Object.values(store.collection).slice(0, 12).map(inst => { const t = TRACK_BY_ID[inst.trackId]; return <button key={inst.uid} onClick={() => setTradeUid(inst.uid)} className={`shrink-0 rounded-lg px-2 py-1.5 text-[10px] ${tradeUid === inst.uid ? 'bg-violet-500' : 'bg-slate-800'}`}>{t.title} CP{inst.cp}{inst.shiny ? ' ✨' : ''}</button> })}
                </div>
                <button disabled={!tradeUid} onClick={() => { const r = store.trade(f.id, tradeUid); say(r.ok ? `Traded! Received ${TRACK_BY_ID[r.received.trackId].title} (IVs rerolled${r.received.lucky ? ', LUCKY!' : ''}) for ${r.cost} dust` : r.reason); if (r.ok) { setTradeUid(null); setTradeFriend(null) } }} className="mt-2 w-full py-2 rounded-xl bg-violet-600 font-bold text-xs disabled:opacity-40">Confirm trade</button>
              </div>
            )}
          </div>) })}
        {(store.tradeLog || []).length > 0 && <div className="text-[10px] text-slate-500">Recent trades: {store.tradeLog.slice(0, 3).map(t => `${TRACK_BY_ID[t.gave]?.title} → ${TRACK_BY_ID[t.got]?.title} (${t.friend})`).join(' · ')}</div>}
      </section>

      <section className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold mb-1">🎉 Party Play</h3>
        {store.party ? (<>
          <div className="text-[11px] text-slate-400">Code <b className="text-white">{store.party.code}</b> · {store.party.members.join(', ')}</div>
          <div className="space-y-2 mt-2">{store.party.challenges.map(c => { const prog = Math.min(c.target, Math.max(0, store.stats[c.type === 'walk' ? 'catches' : c.type] * 0 + (c.type === 'catches' ? store.stats.catches : c.type === 'battles' ? store.stats.battleWins : Math.round(store.profile.distance)) - c.start)); return (
            <div key={c.id} className="bg-slate-800/60 rounded-xl p-2 flex items-center gap-2"><div className="flex-1"><div className="text-[11px] font-semibold">{c.text}</div><div className="h-1.5 bg-slate-900 rounded mt-1"><div className="h-full bg-cyan-400 rounded" style={{ width: `${(prog / c.target) * 100}%` }} /></div><div className="text-[9px] text-slate-400">{prog}/{c.target}</div></div>
            <button disabled={c.done || prog < c.target} onClick={() => say(store.claimPartyChallenge(c.id) ? '+300 XP, +200 coins for the party!' : 'Not done')} className="px-2 py-1.5 rounded-lg bg-cyan-600 text-[10px] font-bold disabled:opacity-40">{c.done ? '✓' : 'Claim'}</button></div>) })}</div>
          <button onClick={() => store.leaveParty()} className="mt-2 text-[11px] text-red-300">Leave party</button>
        </>) : (<><p className="text-[11px] text-slate-400">Create a party to complete group challenges together for shared rewards.</p><button onClick={() => { store.createParty(); say('Party created! Challenges are tracking.') }} className="mt-2 px-4 py-2 rounded-xl bg-cyan-600 font-bold text-xs">Create Party</button></>)}
      </section>

      <section className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold">📮 Postcards & Vivillon-style collection</h3>
        <p className="text-[11px] text-slate-400 mb-2">Regions collected: {earnedRegions.length}/{REGIONS.length} — {earnedRegions.join(', ') || 'none yet'}. Pin postcards from stops & gifts.</p>
        <div className="flex gap-2 mb-2">
          <button onClick={() => claimPostcards(3, { xp: 500, item: 'rainbowlure' }, '3-region bonus')} className="px-2 py-1.5 rounded-lg bg-slate-800 text-[10px]">3 regions 🎁</button>
          <button onClick={() => claimPostcards(6, { xp: 1000, coins: 500, item: 'ultra', qty: 2 }, '6-region bonus')} className="px-2 py-1.5 rounded-lg bg-slate-800 text-[10px]">6 regions 🎁</button>
          <button onClick={() => claimPostcards(9, { xp: 2500, stardust: 1000 }, 'All-region bonus')} className="px-2 py-1.5 rounded-lg bg-slate-800 text-[10px]">9 regions 🎁</button>
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto no-scrollbar">
          {(store.postcards || []).map(p => <button key={p.id} onClick={() => store.pinPostcard(p.id)} className={`rounded-xl p-2 text-left text-[10px] ${p.pinned ? 'bg-amber-500/20 ring-1 ring-amber-400' : 'bg-slate-800/60'}`}>📮 <b>{p.region}</b><br /><span className="text-slate-400">{p.name}</span>{p.pinned ? <br /> : null}{p.pinned && <span className="text-amber-300">📌 pinned</span>}</button>)}
        </div>
      </section>
    </div>
  )
}
