import { player, usePlayer } from '../utils/player'
import { loadYouTubeApi, resolveVideoId } from '../utils/youtube'
import { TRACK_BY_ID } from '../data/tracks'
import { Play, Pause } from 'lucide-react'

// Play/pause for one caught instance (or bare trackId). queue: [{uid, trackId}]
export default function PlayButton({ uid = null, trackId, queue = null, size = 'md', label = null, className = '' }) {
  const p = usePlayer()
  const tId = trackId ?? null
  const isCurrent = p.trackId === tId && (uid ? p.uid === uid : true) && p.status !== 'idle'
  const isPlaying = isCurrent && p.status === 'playing'
  const dims = { sm: 'w-8 h-8', md: 'w-11 h-11', lg: 'w-14 h-14' }[size]
  const iconSize = { sm: 14, md: 18, lg: 24 }[size]

  const onClick = (e) => {
    e.stopPropagation()
    if (isCurrent) { player.toggle(); return }
    const q = queue || [{ uid, trackId: tId }]
    player.play({ uid, trackId: tId }, q)
  }
  const track = TRACK_BY_ID[tId]
  // warm up on finger-down (before the click fires): load the YouTube API
  // and resolve+c cache this track's video, so playback can start inside
  // the tap's user-activation window instead of after an async search
  const warmUp = () => {
    if (!track || isCurrent) return
    loadYouTubeApi()
    resolveVideoId(track)
  }
  return (
    <button onClick={onClick} onPointerDown={warmUp} aria-label={isPlaying ? `Pause ${track?.title}` : `Play ${track?.title}`}
      className={`${label ? 'px-4 h-11' : dims} rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white flex items-center justify-center gap-2 font-bold shadow-lg shadow-fuchsia-500/30 active:scale-95 transition ${className}`}>
      {isPlaying ? <Pause size={iconSize} /> : <Play size={iconSize} className="translate-x-[1px]" />}
      {label && <span className="text-xs">{isPlaying ? 'Pause' : label}</span>}
    </button>
  )
}
