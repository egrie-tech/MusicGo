import { useState } from 'react'
import { useStore } from '../store/store'
import { TRACKS, RARITY, GENRES } from '../data/tracks'
import { Search } from 'lucide-react'

export default function CollectionScreen() {
  const collection = useStore(s => s.collection) || {}
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = TRACKS.filter(t => {
    if (filter !== 'all' && t.genre !== filter && t.rarity !== filter) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.artist.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const total = TRACKS.length
  const caughtCount = Object.keys(collection).length
  const pct = Math.round((caughtCount / total) * 100)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Collection</h1>
        <span className="text-sm text-slate-400">{caughtCount}/{total}</span>
      </div>

      {/* progress */}
      <div className="glass rounded-2xl p-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Dex Completion</span><span className="text-fuchsia-400">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1 text-[10px] text-center">
          {Object.entries(RARITY).map(([k, v]) => {
            const c = TRACKS.filter(t => t.rarity === k && collection[t.id]).length
            const tot = TRACKS.filter(t => t.rarity === k).length
            return <div key={k} className="bg-slate-800/60 rounded-lg py-1">
              <div style={{ color: v.color }} className="font-bold">{c}/{tot}</div>
              <div className="text-slate-500">{v.label}</div>
            </div>
          })}
        </div>
      </div>

      {/* search + filter */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 glass rounded-xl px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracks..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        {GENRES.map(g => <FilterChip key={g} label={g} active={filter === g} onClick={() => setFilter(g)} />)}
        {Object.keys(RARITY).map(r => <FilterChip key={r} label={r} active={filter === r} onClick={() => setFilter(r)} color={RARITY[r].color} />)}
      </div>

      {/* grid */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(t => {
          const c = collection[t.id]
          const r = RARITY[t.rarity]
          return (
            <button key={t.id} onClick={() => setSelected(t)} className={`glass rounded-2xl p-2 text-center transition ${c ? '' : 'opacity-40 grayscale'}`}>
              <div className="w-full aspect-square rounded-xl flex items-center justify-center text-2xl mb-1" style={{ background: c ? `linear-gradient(135deg, hsl(${t.hue},70%,45%), hsl(${(t.hue+60)%360},70%,30%))` : '#1e293b' }}>
                {c ? '🎵' : '?'}
              </div>
              <div className="text-[10px] font-semibold truncate">{c ? t.title : '???'}</div>
              <div className="text-[9px]" style={{ color: r.color }}>{t.rarity}</div>
            </button>
          )
        })}
      </div>

      {/* detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-[480px] mx-auto glass rounded-t-3xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            {collection[selected.id] ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `linear-gradient(135deg, hsl(${selected.hue},70%,45%), hsl(${(selected.hue+60)%360},70%,30%))` }}>🎵</div>
                  <div>
                    <h3 className="font-bold">{selected.title}</h3>
                    <p className="text-sm text-slate-400">{selected.artist} · {selected.album}</p>
                    <span className="text-xs" style={{ color: RARITY[selected.rarity].color }}>{selected.rarity}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <Stat label="Energy" v={selected.stats.energy} />
                  <Stat label="Dance" v={selected.stats.dance} />
                  <Stat label="Tempo" v={selected.stats.tempo} />
                  <Stat label="Caught" v={collection[selected.id].count} />
                </div>
                <div className="text-xs text-slate-400">Caught {new Date(collection[selected.id].caughtAt).toLocaleDateString()}</div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🔒</div>
                <p className="text-slate-400">Not caught yet. Find it on the map!</p>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="w-full py-3 rounded-2xl bg-slate-800 font-semibold">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border ${active ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300' : 'border-slate-700 text-slate-400'}`} style={color && active ? { color } : {}}>
      {label}
    </button>
  )
}
function Stat({ label, v }) {
  return <div className="bg-slate-800/60 rounded-lg py-1"><div className="text-slate-400">{label}</div><div className="font-bold">{v}</div></div>
}
