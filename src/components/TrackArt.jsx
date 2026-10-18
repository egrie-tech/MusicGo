import { GENRE_EMOJI } from '../data/tracks'

export default function TrackArt({ track, inst, size = 'md', rounded = 'rounded-xl' }) {
  const dims = { sm: 'w-10 h-10 text-lg', md: 'w-14 h-14 text-2xl', lg: 'w-24 h-24 text-5xl', xl: 'w-40 h-40 text-7xl' }[size]
  if (!track) return <div className={`${dims} ${rounded} bg-slate-800 flex items-center justify-center`}>?</div>
  const hue = (track.id * 47 + track.genre.length * 13) % 360
  return (
    <div className={`${dims} ${rounded} relative flex items-center justify-center shrink-0 overflow-hidden`}
      style={{ background: `linear-gradient(135deg, hsl(${hue},70%,45%), hsl(${(hue + 60) % 360},70%,28%))`, filter: inst?.shadow ? 'saturate(0.6) brightness(0.75) hue-rotate(40deg)' : undefined }}>
      <span style={inst?.shiny ? { filter: 'drop-shadow(0 0 6px gold)' } : undefined}>{GENRE_EMOJI[track.genre] || '🎵'}</span>
      {inst?.shiny && <span className="absolute top-0.5 left-1 text-[10px]">✨</span>}
      {inst?.shadow && <span className="absolute top-0.5 right-1 text-[10px]">🌑</span>}
      {inst?.mega && <span className="absolute bottom-0.5 right-1 text-[10px]">💠</span>}
      {inst?.costume && <span className="absolute bottom-0.5 left-1 text-[10px]">👘</span>}
    </div>
  )
}
