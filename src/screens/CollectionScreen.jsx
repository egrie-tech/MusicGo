import { useMemo, useState } from 'react'
import { useStore } from '../store/gameStore'
import { TRACKS, TRACK_BY_ID, RARITY, GENRES } from '../data/tracks'
import { getEvolution } from '../data/evolutions'
import { appraisal } from '../utils/game'
import { fastMoves, chargedMoves } from '../data/moves'
import { POTIONS, REVIVES } from '../data/items'
import TrackArt from '../components/TrackArt'
import PlayButton from '../components/PlayButton'
import { player, compositionInfo } from '../utils/player'
import { Search, Heart, Camera } from 'lucide-react'

const TAGS = ['Favorite', 'Battle', 'Raid', 'Trade', 'Shiny', 'Perfect', 'Buddy', 'Showcase']

export default function CollectionScreen() {
  const store = useStore()
  const instances = useMemo(() => Object.values(store.collection || {}), [store.collection])
  const [tab, setTab] = useState('box')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [genre, setGenre] = useState('all')
  const [tag, setTag] = useState('all')
  const [onlyShiny, setOnlyShiny] = useState(false)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 2500) }

  let list = instances.filter(inst => {
    const t = TRACK_BY_ID[inst.trackId]; if (!t) return false
    if (genre !== 'all' && t.genre !== genre) return false
    if (tag !== 'all' && !(inst.tags || []).includes(tag)) return false
    if (onlyShiny && !inst.shiny) return false
    if (search && !`${t.title} ${t.artist} ${t.genre}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  list = [...list].sort((a, b) => sort === 'cp' ? b.cp - a.cp : sort === 'level' ? b.level - a.level : sort === 'plays' ? (b.playCount || 0) - (a.playCount || 0) : sort === 'name' ? TRACK_BY_ID[a.trackId].title.localeCompare(TRACK_BY_ID[b.trackId].title) : b.caughtAt - a.caughtAt)
  const queue = list.map(i => ({ uid: i.uid, trackId: i.trackId }))
  const playAll = (shuffle = false) => {
    if (!list.length) { say('Catch some tracks first!'); return }
    if (shuffle) player.toggleShuffle()
    player.play({ uid: list[0].uid, trackId: list[0].trackId }, list.map(i => ({ uid: i.uid, trackId: i.trackId })))
  }

  const dexCaught = Object.values(store.pokedex || {}).filter(d => d.caught).length
  const sel = selected ? store.collection[selected] : null
  const selTrack = sel ? TRACK_BY_ID[sel.trackId] : null

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">Collection</h1><span className="text-xs text-slate-400">Box {instances.length}/{store.trackStorage} · Dex {dexCaught}/{TRACKS.length}</span></div>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}
      <div className="flex gap-2">
        {[['box', '🎒 Box'], ['dex', '📖 Pokédex']].map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === id ? 'bg-fuchsia-500' : 'bg-slate-800'}`}>{label}</button>)}
        <button onClick={() => setOnlyShiny(s => !s)} className={`px-3 py-2 rounded-xl text-sm ${onlyShiny ? 'bg-amber-500 text-black' : 'bg-slate-800'}`}>✨</button>
      </div>

      {tab === 'box' && (<>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 glass rounded-xl px-3 py-2"><Search size={14} className="text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, artist, genre…" className="bg-transparent outline-none text-sm flex-1" /></div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="glass rounded-xl px-2 text-xs bg-slate-900"><option value="recent">Recent</option><option value="cp">CP</option><option value="level">Level</option><option value="name">Name</option><option value="plays">Most played</option></select>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Chip label="All genres" active={genre === 'all'} onClick={() => setGenre('all')} />
          {GENRES.map(g => <Chip key={g} label={g} active={genre === g} onClick={() => setGenre(g)} />)}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Chip label="All tags" active={tag === 'all'} onClick={() => setTag('all')} />
          {TAGS.map(t => <Chip key={t} label={`#${t}`} active={tag === t} onClick={() => setTag(t)} />)}
        </div>
        {list.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => playAll(false)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold text-xs">▶ Play caught songs</button>
            <button onClick={() => playAll(true)} className="flex-1 py-2.5 rounded-xl bg-slate-800 font-bold text-xs">🔀 Shuffle play</button>
          </div>
        )}
        {list.length === 0 && <div className="glass rounded-2xl p-6 text-center text-slate-400">Nothing here yet — catch tracks on the map, then tap ▶ to listen!</div>}
        <div className="grid grid-cols-3 gap-3">
          {list.map(inst => { const t = TRACK_BY_ID[inst.trackId]; return (
            <div key={inst.uid} onClick={() => setSelected(inst.uid)} className="glass rounded-2xl p-2 text-center relative cursor-pointer">
              {inst.favorite && <Heart size={12} className="absolute top-1.5 right-1.5 text-red-400 fill-red-400 z-10" />}
              <div className="relative">
                <TrackArt track={t} inst={inst} size="lg" />
                <span className="absolute bottom-1 right-1"><PlayButton uid={inst.uid} trackId={inst.trackId} queue={queue} size="sm" /></span>
              </div>
              <div className="text-[10px] font-semibold truncate mt-1">{t.title}</div>
              <div className="text-[9px] text-slate-400">CP {inst.cp} · Lv {inst.level}{(inst.playCount || 0) > 0 ? ` · ▶ ${inst.playCount}` : ''}{inst.hp <= 0 ? ' · FAINTED' : ''}</div>
            </div>) })}
        </div>
      </>)}

      {tab === 'dex' && (
        <div className="grid grid-cols-3 gap-3">
          {TRACKS.map(t => { const d = store.pokedex[t.id]; const seen = d?.seen, caught = d?.caught; return (
            <div key={t.id} className={`glass rounded-2xl p-2 text-center ${caught ? '' : 'opacity-45'}`}>
              <div className="flex justify-center"><TrackArt track={t} inst={d?.shiny ? { shiny: true } : null} size="lg" /></div>
              <div className="text-[10px] font-semibold truncate mt-1">{seen ? t.title : '???'}</div>
              <div className="text-[9px]" style={{ color: RARITY[t.rarity].color }}>{t.rarity}{t.regional ? ` · 🌍 ${t.regional}` : ''}{t.mega ? ' · 💠 Mega' : ''}</div>
              <div className="text-[8px] text-slate-500">{caught ? 'Registered ✓' : seen ? 'Seen' : 'Undiscovered'}</div>
            </div>) })}
        </div>
      )}

      {sel && selTrack && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-[480px] mx-auto glass rounded-t-3xl p-5 space-y-3 max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <TrackArt track={selTrack} inst={sel} size="lg" />
              <div className="flex-1">
                <h3 className="font-bold">{selTrack.title} {sel.shiny && '✨'}{sel.shadow && ' 🌑'}</h3>
                <p className="text-xs text-slate-400">{selTrack.artist} · {selTrack.album} · {selTrack.genre}</p>
                <p className="text-[10px]" style={{ color: RARITY[selTrack.rarity].color }}>{selTrack.rarity} · Form: {sel.form}{sel.costume ? ` · 👘 ${sel.costume}` : ''} · Source: {sel.source}</p>
                <p className="text-[10px] text-slate-500">Caught {new Date(sel.caughtAt).toLocaleDateString()} · 🍬 Species candy: {store.candy[sel.trackId] || 0}{selTrack.mega ? ` · 💠 Mega energy: ${store.megaEnergy[sel.trackId] || 0}/${selTrack.mega.energy}` : ''}</p>
              </div>
              <button onClick={() => store.toggleFavorite(sel.uid)} className="text-2xl">{sel.favorite ? '❤️' : '🤍'}</button>
            </div>

            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <PlayButton uid={sel.uid} trackId={sel.trackId} queue={queue} size="lg" />
              <div className="flex-1">
                <div className="text-xs font-bold">🎧 Listen to this song</div>
                <div className="text-[10px] text-slate-400">{(() => { const c = compositionInfo(selTrack); return `${c.bpm} BPM · Key of ${c.key} · ${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, '0')} arrangement` })()}</div>
                <div className="text-[10px] text-slate-500">▶ {sel.playCount || 0} plays{sel.lastPlayedAt ? ` · last ${new Date(sel.lastPlayedAt).toLocaleDateString()}` : ''} · unique live performance of your catch</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <Stat label="CP" v={sel.cp} /><Stat label="HP" v={`${sel.hp}/${sel.maxHp}`} /><Stat label="Level" v={sel.level} /><Stat label="Buddy km" v={selTrack.buddyKm} />
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${sel.hp / sel.maxHp > 0.3 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${(sel.hp / sel.maxHp) * 100}%` }} /></div>

            <div className="glass rounded-xl p-3">
              <div className="text-xs font-bold mb-1">⭐ Appraisal — {appraisal(sel.ivs).label}</div>
              <div className="text-[10px] text-slate-400 mb-2">{appraisal(sel.ivs).detail} {'★'.repeat(appraisal(sel.ivs).stars)}{'☆'.repeat(3 - appraisal(sel.ivs).stars)}</div>
              {[['Attack', sel.ivs.a], ['Defense', sel.ivs.d], ['Stamina', sel.ivs.s]].map(([label, v]) => (
                <div key={label} className="flex items-center gap-2 text-[10px] mb-1"><span className="w-14 text-slate-400">{label}</span><div className="flex-1 h-1.5 bg-slate-800 rounded"><div className={`h-full rounded ${v >= 13 ? 'bg-orange-400' : 'bg-cyan-400'}`} style={{ width: `${(v / 15) * 100}%` }} /></div><span>{v}/15</span></div>
              ))}
              <div className="text-[10px] text-slate-400 mt-2">Fast: {fastMoves(selTrack.genre)[0].name} · Charged: {chargedMoves(selTrack.genre).map(m => m.name).join(' / ')}</div>
              {(selTrack.forms || []).length > 1 && <div className="flex gap-1 mt-2 flex-wrap">{selTrack.forms.map(f => <button key={f} onClick={() => store.setForm(sel.uid, f)} className={`px-2 py-1 rounded-lg text-[10px] ${sel.form === f ? 'bg-fuchsia-500' : 'bg-slate-800'}`}>{f}</button>)}</div>}
            </div>

            <div>
              <div className="text-[10px] text-slate-400 mb-1">Tags</div>
              <div className="flex gap-1 flex-wrap">{TAGS.map(t => { const on = (sel.tags || []).includes(t); return <button key={t} onClick={() => store.setTags(sel.uid, on ? sel.tags.filter(x => x !== t) : [...(sel.tags || []), t])} className={`px-2 py-1 rounded-full text-[10px] border ${on ? 'bg-cyan-500/25 border-cyan-400' : 'border-slate-700 text-slate-400'}`}>#{t}</button> })}</div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[...POTIONS, ...REVIVES].map(item => (store.inventory[item.id] > 0 && ((item.cat === 'revive') === (sel.hp <= 0))) ? <button key={item.id} onClick={() => { store.healInstance(sel.uid, item.id); say(`${item.name} used`) }} className="px-2 py-1.5 rounded-lg bg-emerald-900/50 text-emerald-300 text-[10px]">{item.icon} {item.name} ×{store.inventory[item.id]}</button> : null)}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => say(store.powerUp(sel.uid) ? 'Powered up! (+stardust & candy)' : 'Not enough stardust/candy or max level')} className="py-2.5 rounded-xl bg-blue-600 text-xs font-bold">⬆️ Power Up (dust+candy)</button>
              {getEvolution(sel.trackId) && <button onClick={() => { const r = store.evolve(sel.uid); say(r.ok ? `Evolved into ${TRACK_BY_ID[r.to].title}!` : r.reason) }} className="py-2.5 rounded-xl bg-purple-600 text-xs font-bold">🦋 Evolve ({getEvolution(sel.trackId).candy} 🍬)</button>}
              {selTrack.mega && <button onClick={() => say(store.megaEvolve(sel.uid) ? `${selTrack.mega.name} activated for 8h!` : `Need ${selTrack.mega.energy} mega energy (raids/buddy)`)} className="py-2.5 rounded-xl bg-cyan-600 text-xs font-bold">💠 Mega Evolve</button>}
              {sel.shadow && <button onClick={() => say(store.purify(sel.uid) ? 'Purified! IVs boosted, level up' : 'Need 1000 dust + 5 candy')} className="py-2.5 rounded-xl bg-violet-600 text-xs font-bold">✨ Purify Shadow</button>}
              {!sel.costume && selTrack.costume && (store.inventory.costume > 0) && <button onClick={() => say(store.applyCostume(sel.uid) ? 'Costume applied!' : 'Need a Stage Costume item')} className="py-2.5 rounded-xl bg-pink-600 text-xs font-bold">👘 Apply Costume</button>}
              <button onClick={() => { store.setBuddy(sel.uid); say('Set as your Buddy! See Buddy tab') }} className="py-2.5 rounded-xl bg-amber-600 text-xs font-bold">🐾 Set Buddy</button>
              <button onClick={() => { const s = store.takeSnapshot(sel.uid); say(s ? `📷 Snapshot taken ${s.scene}${s.photobomb ? ' — PHOTOBOMB!' : ''}` : 'Failed') }} className="py-2.5 rounded-xl bg-slate-700 text-xs font-bold flex items-center justify-center gap-1"><Camera size={13} /> Snapshot</button>
              <button onClick={() => { if (!sel.favorite && confirm('Transfer for 1 candy?')) { store.transfer(sel.uid); setSelected(null) } else if (sel.favorite) say('Unfavorite before transferring') }} className="py-2.5 rounded-xl bg-red-900/50 text-red-300 text-xs font-bold">♻️ Transfer (+1 🍬)</button>
            </div>
            <button onClick={() => setSelected(null)} className="w-full py-3 rounded-2xl bg-slate-800 font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
function Chip({ label, active, onClick }) { return <button onClick={onClick} className={`shrink-0 px-3 py-1 rounded-full text-[11px] border ${active ? 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-200' : 'border-slate-700 text-slate-400'}`}>{label}</button> }
function Stat({ label, v }) { return <div className="bg-slate-800/60 rounded-lg py-1.5"><div className="text-slate-400 text-[9px]">{label}</div><div className="font-bold">{v}</div></div> }
