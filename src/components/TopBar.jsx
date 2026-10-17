import { Coins, Zap } from "lucide-react"

export default function TopBar({ profile }) {
  const p = profile || { level: 1, xp: 0, avatar: '🎧', name: 'Player', title: 'Rookie Listener', coins: 0 }
  const xpToNext = (lvl) => 100 * (lvl + 1) * (lvl + 2) / 2
  const cur = 100 * p.level * (p.level + 1) / 2
  const pct = Math.min(100, ((p.xp - cur) / (xpToNext(p.level) - cur)) * 100)
  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{p.avatar}</span>
          <div>
            <div className="text-sm font-bold leading-tight">{p.name}</div>
            <div className="text-[10px] text-slate-400">Lv.{p.level} · {p.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-amber-400"><Coins size={14} />{p.coins}</span>
          <span className="flex items-center gap-1 text-fuchsia-400"><Zap size={14} />{p.xp}</span>
        </div>
      </div>
      <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
