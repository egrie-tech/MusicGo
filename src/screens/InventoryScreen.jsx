import { useState } from 'react'
import { useStore } from '../store/gameStore'
import { ITEMS } from '../data/items'
import { fmtTimeLeft } from '../utils/game'

const CATS = [['all', 'All'], ['disc', 'Discs'], ['berry', 'Berries'], ['potion', 'Potions'], ['revive', 'Revives'], ['lure', 'Lures'], ['booster', 'Boosters'], ['pass', 'Passes'], ['egg', 'Eggs'], ['storage', 'Storage']]
const usable = (i) => ['incense', 'luckyegg', 'radar'].includes(i.id)

export default function InventoryScreen() {
  const store = useStore()
  const [tab, setTab] = useState('items')
  const [cat, setCat] = useState('all')
  const [note, setNote] = useState(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3000) }
  const itemTotal = store.itemCount()
  const boxTotal = Object.keys(store.collection || {}).length

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">🎒 Bag & Shop</h1>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="glass rounded-xl p-2">Items <b>{itemTotal}/{store.itemStorage}</b><div className="h-1.5 bg-slate-800 rounded mt-1"><div className="h-full bg-sky-400 rounded" style={{ width: `${Math.min(100, (itemTotal / store.itemStorage) * 100)}%` }} /></div></div>
        <div className="glass rounded-xl p-2">Tracks <b>{boxTotal}/{store.trackStorage}</b><div className="h-1.5 bg-slate-800 rounded mt-1"><div className="h-full bg-fuchsia-400 rounded" style={{ width: `${Math.min(100, (boxTotal / store.trackStorage) * 100)}%` }} /></div></div>
      </div>
      {(store.effects.incenseUntil > Date.now() || store.effects.luckyEggUntil > Date.now() || store.effects.radarUntil > Date.now()) && (
        <div className="glass rounded-xl px-3 py-2 text-[11px]">Active: {store.effects.incenseUntil > Date.now() && `🕯️ Incense ${fmtTimeLeft(store.effects.incenseUntil - Date.now())} `}{store.effects.luckyEggUntil > Date.now() && `🥚 2×XP ${fmtTimeLeft(store.effects.luckyEggUntil - Date.now())} `}{store.effects.radarUntil > Date.now() && `📡 Radar ${fmtTimeLeft(store.effects.radarUntil - Date.now())}`}</div>
      )}
      <div className="flex gap-2">
        <button onClick={() => setTab('items')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'items' ? 'bg-fuchsia-500' : 'bg-slate-800'}`}>My Items</button>
        <button onClick={() => setTab('shop')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'shop' ? 'bg-fuchsia-500' : 'bg-slate-800'}`}>Shop · 🪙 {store.profile.coins}</button>
      </div>

      {tab === 'items' && (<>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">{CATS.map(([id, l]) => <button key={id} onClick={() => setCat(id)} className={`shrink-0 px-3 py-1 rounded-full text-[11px] border ${cat === id ? 'bg-fuchsia-500/25 border-fuchsia-400' : 'border-slate-700 text-slate-400'}`}>{l}</button>)}</div>
        <div className="grid grid-cols-2 gap-3">
          {ITEMS.filter(i => cat === 'all' || i.cat === cat).map(i => (
            <div key={i.id} className="glass rounded-2xl p-3">
              <div className="text-3xl mb-1">{i.icon}</div>
              <div className="font-bold text-sm">{i.name}</div>
              <div className="text-[10px] text-slate-400 min-h-6">{i.desc}</div>
              <div className="mt-1.5 flex justify-between items-center"><span className="text-xs text-fuchsia-300 font-bold">×{store.inventory[i.id] || 0}</span>
                {usable(i) && <button onClick={() => say(store.activateBooster(i.id) ? `${i.name} active for 30 min!` : `No ${i.name}`)} className="px-2 py-1 rounded-lg bg-emerald-600 text-[10px] font-bold">Use</button>}
              </div>
            </div>
          ))}
        </div>
      </>)}

      {tab === 'shop' && (
        <div className="space-y-2">
          <button onClick={() => say(store.claimDailyFree() ? 'Daily free box claimed!' : 'Already claimed today')} className="w-full glass rounded-2xl p-3 text-left"><span className="font-bold text-sm">🎁 Free Daily Box</span><span className="block text-[10px] text-slate-400">5 discs · 2 razz · 100 coins — free every day</span></button>
          {ITEMS.filter(i => i.price > 0).map(i => (
            <div key={i.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <span className="text-3xl">{i.icon}</span>
              <div className="flex-1"><div className="font-bold text-sm">{i.name}</div><div className="text-[10px] text-slate-400">{i.desc}</div></div>
              <span className="text-[10px] text-slate-500">own {store.inventory[i.id] || 0}</span>
              <button onClick={() => say(store.buyItem(i.id) ? `Bought ${i.name}` : 'Not enough coins')} className="px-3 py-2 rounded-xl bg-amber-500/25 text-amber-300 text-xs font-bold">🪙 {i.price}</button>
            </div>
          ))}
          <p className="text-[10px] text-slate-500 text-center">Earn coins from catches, gyms, research and events. Master Discs & Premium items drop from raids.</p>
        </div>
      )}
    </div>
  )
}
