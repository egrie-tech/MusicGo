import { useState } from 'react'
import { useStore, xpToNext } from '../store/gameStore'
import { TRACKS } from '../data/tracks'
import { Edit3, Trophy, Music, MapPin, Flame } from 'lucide-react'

const AVATARS = ['🎧','🎤','🎸','🎹','🎷','🎻','💃','🕺','👑','🔥','⚡','🌙','🎵','💿','🏆']

export default function ProfileScreen() {
  const profile = useStore(s => s.profile) || {}
  const collection = useStore(s => s.collection) || {}
  const setName = useStore(s => s.setName)
  const setAvatar = useStore(s => s.setAvatar)
  const reset = useStore(s => s.reset)
  const [editing, setEditing] = useState(false)
  const [name, setNameInput] = useState(profile.name)

  const { current, needed } = xpToNext(profile)
  const caughtCount = Object.keys(collection).length

  const badges = [
    { label: 'First Catch', earned: caughtCount >= 1, icon: '🎵' },
    { label: 'Collector (10)', earned: caughtCount >= 10, icon: '📀' },
    { label: 'Half Dex (22)', earned: caughtCount >= 22, icon: '💿' },
    { label: 'Full Dex', earned: caughtCount >= TRACKS.length, icon: '🏆' },
    { label: 'Battle Winner', earned: profile.battlesWon >= 1, icon: '⚔️' },
    { label: 'Veteran (5 wins)', earned: profile.battlesWon >= 5, icon: '👑' },
    { label: 'Level 5', earned: profile.level >= 5, icon: '⭐' },
    { label: 'Level 10', earned: profile.level >= 10, icon: '🌟' },
  ]

  const save = () => { setName(name); setEditing(false) }

  return (
    <div className="p-4 space-y-4">
      <div className="glass rounded-3xl p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, #a855f7, transparent 70%)' }} />
        <div className="relative">
          <div className="text-6xl mb-2">{profile.avatar}</div>
          {editing ? (
            <div className="flex gap-2 justify-center">
              <input value={name} onChange={e => setNameInput(e.target.value)} className="bg-slate-800 rounded-xl px-3 py-1 text-center" />
              <button onClick={save} className="px-3 py-1 bg-fuchsia-500 rounded-xl text-sm">Save</button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <button onClick={() => setEditing(true)}><Edit3 size={14} className="text-slate-400" /></button>
            </div>
          )}
          <p className="text-sm text-slate-400 mt-1">{profile.title} · Level {profile.level}</p>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>XP {profile.xp}</span><span>{needed} to next</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${(current/needed)*100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* avatar picker */}
      <div className="glass rounded-2xl p-3">
        <div className="text-xs text-slate-400 mb-2">Avatar</div>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map(a => (
            <button key={a} onClick={() => setAvatar(a)} className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${profile.avatar === a ? 'bg-fuchsia-500/30 ring-1 ring-fuchsia-500' : 'bg-slate-800/60'}`}>{a}</button>
          ))}
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Music size={16} />} label="Caught" value={caughtCount} />
        <Stat icon={<Trophy size={16} />} label="Battles Won" value={profile.battlesWon} />
        <Stat icon={<MapPin size={16} />} label="Distance" value={`${(profile.distance/1000).toFixed(1)} km`} />
        <Stat icon={<Flame size={16} />} label="Streak" value={`${profile.streak} days`} />
      </div>

      {/* badges */}
      <div className="glass rounded-2xl p-3">
        <h3 className="text-sm font-semibold mb-2">Badges</h3>
        <div className="grid grid-cols-4 gap-2">
          {badges.map(b => (
            <div key={b.label} className={`rounded-xl p-2 text-center ${b.earned ? 'bg-fuchsia-500/10' : 'bg-slate-800/40 opacity-40'}`}>
              <div className="text-2xl">{b.icon}</div>
              <div className="text-[9px] mt-1 text-slate-300">{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => { if (confirm('Reset all progress?')) reset() }} className="w-full py-3 rounded-2xl bg-red-900/40 text-red-300 font-semibold text-sm">Reset Progress</button>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="glass rounded-2xl p-3 flex items-center gap-3">
      <div className="text-fuchsia-400">{icon}</div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  )
}
