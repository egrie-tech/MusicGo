import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { player, usePlayer, compositionInfo } from '../utils/player'
import { createYtPlayer, ytPause, ytSeekTo, ytPlay, ytDestroy } from '../utils/youtube'
import { TRACK_BY_ID } from '../data/tracks'
import { useStore } from '../store/gameStore'
import TrackArt from './TrackArt'
import { Play, Pause, SkipBack, SkipForward, X, Shuffle, Repeat, Repeat1, Volume2, ChevronUp, MonitorPlay, AudioLines, LoaderCircle } from 'lucide-react'

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const YT_SLOT = 'musicgo-yt-slot'

export default function MiniPlayer() {
  const p = usePlayer()
  const navigate = useNavigate()
  const recordListen = useStore(s => s.recordListen)
  const collection = useStore(s => s.collection) || {}
  const [expanded, setExpanded] = useState(false)
  const countedRef = useRef(null)
  const repeatRef = useRef(p.repeat)
  repeatRef.current = p.repeat
  const statusRef = useRef(p.status)
  statusRef.current = p.status

  const track = p.trackId ? TRACK_BY_ID[p.trackId] : null
  const inst = p.uid ? collection[p.uid] : null
  const onYouTube = p.source === 'youtube' && !p.usingSynth

  // count a listen once per (track start)
  useEffect(() => {
    const key = p.uid ? `${p.uid}:${p.startedAt}` : null
    if (key && p.status === 'playing' && countedRef.current !== key) {
      countedRef.current = key
      if (p.uid) recordListen(p.uid)
    }
  }, [p.uid, p.startedAt, p.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Create the YouTube iframe as soon as a YouTube track is active — ideally
  // still inside the user's tap — then load the video once search resolves.
  // Creating it late (after async search) makes browsers block autoplay,
  // which forces a second press on YouTube's own play button.
  // The slot div must stay mounted while playing (YouTube replaces it with
  // an iframe), so it is rendered collapsed-but-present below.
  useEffect(() => {
    if (p.source !== 'youtube' || p.usingSynth || !p.trackId) return
    let cancelled = false
    createYtPlayer(YT_SLOT, p.videoId || null, {
      onReady: (e) => {
        if (cancelled) return
        player.syncYouTubeDuration()
        // explicitly start playback (autoplay=1 alone is not reliable)
        if (statusRef.current === 'paused') ytPause()
        else { try { e.target.playVideo() } catch (err) { ytPlay() } }
      },
      onEnded: () => {
        if (repeatRef.current === 'one') { ytSeekTo(0); ytPlay() }
        else player.next(true)
      },
      onError: () => { if (!cancelled) player.fallbackToSynth('YouTube could not play this video') },
    })
    return () => { cancelled = true }
  }, [p.source, p.usingSynth, p.videoId])

  // whenever we leave YouTube mode (synth fallback or manual switch), the
  // slot unmounts — destroy the player with it, otherwise its stale object
  // silently swallows later loadVideoById calls and YouTube stays broken
  useEffect(() => {
    if (p.source === 'synth' || p.usingSynth) ytDestroy()
  }, [p.source, p.usingSynth])

  // tear down the iframe when the player UI unmounts
  useEffect(() => () => ytDestroy(), [])

  if (!track || p.status === 'idle') return null
  const info = compositionInfo(track)
  const loading = p.status === 'loading'

  return (
    <div className="absolute left-2 right-2 z-[60]" style={{ bottom: 76 }}>
      <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-black/60" style={{ background: 'rgba(15,10,30,0.94)' }}>
        <button className="w-full flex items-center gap-3 px-3 pt-2 pb-1 text-left" onClick={() => setExpanded(e => !e)}>
          <div className={p.status === 'playing' ? 'float' : ''}><TrackArt track={track} inst={inst} size="md" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate flex items-center gap-1.5">
              {loading && <LoaderCircle size={12} className="animate-spin text-red-400 shrink-0" />}
              <span className="truncate">{track.title} {inst?.shiny ? '✨' : ''}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {track.artist} · {onYouTube ? <>▶ YouTube{p.videoId ? '' : ' · searching…'}</> : p.source === 'youtube' ? 'Synth fallback' : 'Synth'} · plays {inst?.playCount || 0}
            </div>
          </div>
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold shrink-0 ${onYouTube ? 'bg-red-500/20 text-red-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
            {onYouTube ? <MonitorPlay size={11} /> : <AudioLines size={11} />}{onYouTube ? 'YouTube' : 'Synth'}
          </span>
          <ChevronUp size={16} className={`text-slate-400 transition shrink-0 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {/* YouTube video: always mounted while a YouTube track is active so
            playback continues collapsed; expands to a real 16:9 video. */}
        {p.source === 'youtube' && !p.usingSynth && (
          <div className="px-3" style={{ height: expanded && p.videoId ? undefined : 0, overflow: 'hidden' }}>
            <div className={expanded && p.videoId ? 'w-full aspect-video bg-black rounded-xl overflow-hidden' : 'w-full'} style={!expanded || !p.videoId ? { height: 0 } : undefined}>
              <div id={YT_SLOT} className="w-full h-full" />
            </div>
          </div>
        )}

        {p.ytError && p.usingSynth && (
          <div className="mx-3 mb-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-1 text-[9px] text-amber-200">⚠️ {p.ytError}</div>
        )}
        {loading && <div className="mx-3 mb-1 text-[9px] text-slate-400">Finding “{track.title}” on YouTube…</div>}

        <div className="px-3">
          <input type="range" min="0" max={p.duration || 0} step="1" value={Math.floor(p.progress)}
            onChange={e => player.seek(Number(e.target.value))} disabled={!p.duration}
            className="w-full h-1 accent-red-500 cursor-pointer disabled:opacity-40" aria-label="Seek" />
          <div className="flex justify-between text-[9px] text-slate-500 -mt-0.5">
            <span>{fmt(p.progress)}</span>
            <span>{p.duration ? `-${fmt(Math.max(0, p.duration - p.progress))}` : '--:--'}</span>
          </div>
        </div>

        {expanded && (
          <div className="px-3 pb-1.5 space-y-1.5">
            <div className="flex items-center gap-3">
              <Volume2 size={14} className="text-slate-400 shrink-0" />
              <input type="range" min="0" max="1" step="0.05" value={p.volume} onChange={e => player.setVolume(Number(e.target.value))} className="flex-1 h-1 accent-cyan-400" aria-label="Volume" />
              <button onClick={() => navigate('/collection')} className="text-[10px] font-bold text-fuchsia-300 shrink-0">Collection</button>
              <span className="text-[9px] text-slate-500 shrink-0">Queue {p.index + 1}/{p.queue.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500">Source:</span>
              <button onClick={() => player.setSource('youtube')} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${p.source === 'youtube' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300'}`}><MonitorPlay size={11} /> YouTube</button>
              <button onClick={() => player.setSource('synth')} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${p.source === 'synth' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300'}`}><AudioLines size={11} /> Synth</button>
              {p.source === 'synth' && <span className="text-[9px] text-slate-500">{info.bpm} BPM · {info.key}</span>}
              {onYouTube && p.videoId && <a className="text-[9px] text-red-300 font-bold ml-auto" href={`https://www.youtube.com/watch?v=${p.videoId}`} target="_blank" rel="noreferrer">Watch on YouTube ↗</a>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pb-2">
          <button onClick={() => player.toggleShuffle()} className={`p-2 rounded-full ${p.shuffle ? 'text-fuchsia-400 bg-fuchsia-500/15' : 'text-slate-400'}`} aria-label="Shuffle"><Shuffle size={15} /></button>
          <button onClick={() => player.prev()} className="p-2 text-white" aria-label="Previous"><SkipBack size={19} /></button>
          <button onClick={() => player.toggle()} disabled={loading} className="w-11 h-11 rounded-full bg-gradient-to-r from-red-500 to-fuchsia-500 flex items-center justify-center shadow-lg disabled:opacity-50" aria-label={p.status === 'playing' ? 'Pause' : 'Play'}>
            {loading ? <LoaderCircle size={20} className="animate-spin" /> : p.status === 'playing' ? <Pause size={20} /> : <Play size={20} className="translate-x-[1px]" />}
          </button>
          <button onClick={() => player.next()} className="p-2 text-white" aria-label="Next"><SkipForward size={19} /></button>
          <button onClick={() => player.cycleRepeat()} className={`p-2 rounded-full ${p.repeat !== 'off' ? 'text-fuchsia-400 bg-fuchsia-500/15' : 'text-slate-400'}`} aria-label="Repeat">{p.repeat === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}</button>
          <button onClick={() => player.stop()} className="p-2 text-slate-500" aria-label="Close player"><X size={15} /></button>
        </div>
      </div>
    </div>
  )
}
