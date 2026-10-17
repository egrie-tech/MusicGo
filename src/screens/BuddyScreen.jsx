import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACKS } from '../data/tracks'

export default function BuddyScreen() {
  const navigate = useNavigate()
  const buddy = useStore(s => s.buddy)
  const buddyHearts = useStore(s => s.buddyHearts) || 0
  const buddyCandy = useStore(s => s.buddyCandy) || 0
  const collection = useStore(s => s.collection) || {}
  const setBuddy = useStore(s => s.setBuddy)
  const clearBuddy = useStore(s => s.clearBuddy)
  const addBuddyHeart = useStore(s => s.addBuddyHeart)

  const buddyTrack = buddy ? TRACKS.find(t => t.id === buddy) : null
  const caughtIds = Object.keys(collection).map(Number)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Buddy</h1>
        <button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Back</button>
      </div>

      {buddyTrack ? (
        <div className="glass rounded-3xl p-5 text-center">
          <div className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-4xl float" style={{ background: `linear-gradient(135deg, hsl(${buddyTrack.hue},70%,45%), hsl(${(buddyTrack.hue+60)%360},70%,30%))` }}>🎵</div>
          <h2 className="mt-3 font-bold">{buddyTrack.title}</h2>
          <p className="text-sm text-slate-400">{buddyTrack.artist}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-800/60 rounded-xl p-2"><div className="text-[10px] text-slate-400">Hearts</div><div className="font-bold">❤️ {buddyHearts}</div></div>
            <div className="bg-slate-800/60 rounded-xl p-2"><div className="text-[10px] text-slate-400">Candy earned</div><div className="font-bold">🍬 {buddyCandy}</div></div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={addBuddyHeart} className="flex-1 py-2 rounded-xl bg-pink-600 text-sm font-semibold">Give Heart</button>
            <button onClick={clearBuddy} className="flex-1 py-2 rounded-xl bg-slate-800 text-sm font-semibold">Swap Buddy</button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Walk to earn candy. Candy can evolve your buddy.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 text-center text-slate-400">
          <div className="text-4xl mb-2">🐾</div>
          <p>No buddy selected. Pick one from your collection.</p>
        </div>
      )}

      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-semibold mb-2">Choose a buddy</h3>
        <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto no-scrollbar">
          {caughtIds.map(id => {
            const t = TRACKS.find(x => x.id === id)
            return (
              <button key={id} onClick={() => setBuddy(id)} className={`rounded-xl p-2 text-center ${buddy === id ? 'ring-2 ring-fuchsia-500' : 'bg-slate-800/60'}`}>
                <div className="w-full aspect-square rounded-lg flex items-center justify-center text-xl mb-1" style={{ background: `linear-gradient(135deg, hsl(${t.hue},70%,45%), hsl(${(t.hue+60)%360},70%,30%))` }}>🎵</div>
                <div className="text-[9px] truncate">{t.title}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
