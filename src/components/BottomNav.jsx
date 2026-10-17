import { NavLink } from 'react-router-dom'
import { Map, Music, Swords, User, Backpack } from 'lucide-react'

const items = [
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/collection', icon: Music, label: 'Collection' },
  { to: '/battle', icon: Swords, label: 'Battle' },
  { to: '/inventory', icon: Backpack, label: 'Items' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-slate-700">
      <div className="flex justify-around items-center py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${isActive ? 'text-fuchsia-400' : 'text-slate-400'}`
          }>
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
