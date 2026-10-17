import { useState } from 'react'
import { useStore } from '../store/store'
import { ITEMS } from '../data/items'
import { ShoppingCart } from 'lucide-react'

export default function InventoryScreen() {
  const inventory = useStore(s => s.inventory)
  const profile = useStore(s => s.profile)
  const buyItem = useStore(s => s.buyItem)
  const [tab, setTab] = useState('items') // items | shop

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Inventory</h1>
      <div className="flex gap-2">
        <button onClick={() => setTab('items')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === 'items' ? 'bg-fuchsia-500' : 'bg-slate-800'}`}>My Items</button>
        <button onClick={() => setTab('shop')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === 'shop' ? 'bg-fuchsia-500' : 'bg-slate-800'}`}>Shop</button>
      </div>

      {tab === 'items' && (
        <div className="grid grid-cols-2 gap-3">
          {ITEMS.map(i => (
            <div key={i.id} className="glass rounded-2xl p-3">
              <div className="text-3xl mb-1">{i.icon}</div>
              <div className="font-semibold text-sm">{i.name}</div>
              <div className="text-[10px] text-slate-400">{i.desc}</div>
              <div className="mt-2 text-xs text-fuchsia-400">x{inventory[i.id] || 0}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'shop' && (
        <div className="space-y-3">
          <div className="text-sm text-slate-400">Coins: <span className="text-amber-400 font-bold">{profile.coins}</span></div>
          {ITEMS.map(i => (
            <div key={i.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <div className="text-3xl">{i.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{i.name}</div>
                <div className="text-[10px] text-slate-400">{i.desc}</div>
              </div>
              <button onClick={() => buyItem(i.id, 1)} disabled={i.price === 0 || profile.coins < i.price}
                className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold disabled:opacity-40 flex items-center gap-1">
                <ShoppingCart size={12} /> {i.price === 0 ? 'Free' : i.price}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
