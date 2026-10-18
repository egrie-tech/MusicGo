import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACK_BY_ID } from '../data/tracks'
import TrackArt from '../components/TrackArt'
import PlayButton from '../components/PlayButton'

export default function BuddyScreen() {
  const navigate = useNavigate()
  const store = useStore()
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3000) }
  const buddy = store.buddy
  const inst = buddy ? store.collection[buddy.uid] : null
  const track = inst ? TRACK_BY_ID[inst.trackId] : null
  const lvl = store.buddyLevel()
  const heartsNext = lvl.next ? Math.round(((buddy?.totalHearts || 0) / lvl.next) * 100) : 100

  const interact = (kind) => {
    if (!buddy) return
    if (kind === 'play') { store.addBuddyHearts(1, 'play'); say('You played together! +1 ❤️') }
    if (kind === 'feed') { if (store.consumeItem('razz') || store.consumeItem('nanab')) { store.addBuddyHearts(1, 'feed'); say('Fed a berry! +1 ❤️') } else say('No berries in your bag') }
    if (kind === 'photo') { const s = store.takeSnapshot(buddy.uid); say(`📷 Snapshot ${s?.scene || ''}! +1 ❤️ (max daily)`) }
    if (kind === 'battle') navigate('/battle')
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">🐾 Buddy</h1><button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Map</button></div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}
      {track ? (
        <div className="glass rounded-3xl p-5 text-center">
          <div className="flex justify-center float"><TrackArt track={track} inst={inst} size="xl" rounded="rounded-3xl" /></div>
          <h2 className="mt-3 font-bold">{track.title}</h2>
          <p className="text-xs text-slate-400">{track.artist} · finds candy every {track.buddyKm} km{track.mega ? ' · +5 Mega Energy per candy' : ''}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-800/60 rounded-xl p-2"><div className="text-[9px] text-slate-400">Level</div><div className="font-bold">{lvl.name}</div></div>
            <div className="bg-slate-800/60 rounded-xl p-2"><div className="text-[9px] text-slate-400">Hearts today</div><div className="font-bold">❤️ {buddy.heartsToday || 0}</div></div>
            <div className="bg-slate-800/60 rounded-xl p-2"><div className="text-[9px] text-slate-400">Total / found</div><div className="font-bold">{buddy.totalHearts} ❤️ · {buddy.candyFound} 🍬</div></div>
          </div>
          <div className="mt-2 text-left"><div className="flex justify-between text-[9px] text-slate-400"><span>Next buddy level {lvl.next ? `at ${lvl.next} hearts` : ''}</span><span>{Math.min(100, heartsNext)}%</span></div><div className="h-2 bg-slate-800 rounded-full"><div className="h-full bg-pink-500 rounded-full" style={{ width: `${Math.min(100, heartsNext)}%` }} /></div></div>
          <div className="text-left"><div className="flex justify-between text-[9px] text-slate-400 mt-2"><span>Candy walk progress</span><span>{(((buddy.candyProgressM || 0) / 1000)).toFixed(2)} / {track.buddyKm} km</span></div><div className="h-2 bg-slate-800 rounded-full"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, ((buddy.candyProgressM || 0) / (track.buddyKm * 1000)) * 100)}%` }} /></div></div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            <button onClick={() => interact('play')} className="py-2 rounded-xl bg-pink-600 text-[11px] font-bold">🎾 Play</button>
            <button onClick={() => interact('feed')} className="py-2 rounded-xl bg-red-600 text-[11px] font-bold">🍓 Feed</button>
            <button onClick={() => interact('photo')} className="py-2 rounded-xl bg-cyan-600 text-[11px] font-bold">📷 Photo</button>
            <button onClick={() => interact('battle')} className="py-2 rounded-xl bg-violet-600 text-[11px] font-bold">⚔️ Battle</button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2"><PlayButton uid={inst.uid} trackId={inst.trackId} queue={Object.values(store.collection).map(i => ({ uid: i.uid, trackId: i.trackId }))} size="md" label="Listen together" /></div>
          <div className="flex gap-2 mt-2"><button onClick={() => { const h = store.addDistance(1000); say(h?.length ? 'Egg hatched while walking!' : `Walked 1 km with ${track.title}`) }} className="flex-1 py-2 rounded-xl bg-emerald-600 text-xs font-bold">🚶 Walk 1 km together</button><button onClick={() => store.clearBuddy()} className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-bold">Swap buddy</button></div>
          <p className="text-[9px] text-slate-500 mt-2">Best Buddies get a CP boost badge. Hearts also come from walking, battles and snapshots.</p>
        </div>
      ) : <div className="glass rounded-2xl p-6 text-center text-slate-400"><div className="text-4xl mb-2">🐾</div>No buddy yet. Choose one below — walk together to earn species candy.</div>}

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-bold mb-2">Choose a buddy</h3>
        <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto no-scrollbar">
          {Object.values(store.collection).map(i => { const t = TRACK_BY_ID[i.trackId]; return <button key={i.uid} onClick={() => store.setBuddy(i.uid)} className={`rounded-xl p-1.5 text-center ${buddy?.uid === i.uid ? 'ring-2 ring-pink-500' : 'bg-slate-800/60'}`}><div className="flex justify-center"><TrackArt track={t} inst={i} size="md" /></div><div className="text-[8px] truncate mt-1">{t.title}</div></button> })}
        </div>
      </div>
    </div>
  )
}
