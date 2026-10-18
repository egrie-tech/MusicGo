import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../store/gameStore'
import { TRACK_BY_ID, GENRE_EMOJI } from '../data/tracks'
import { generatePois, distanceMeters, spawnPool, makeSpawn, biomeGenres, RARITY_COLOR } from '../utils/geo'
import { DEFAULT_CENTER } from '../utils/geo'
import { activeEvents, activeCommunityDay } from '../data/events'
import { Navigation, RefreshCw, Footprints, CloudSun } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
const icon = (html, size = 38) => L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
const spawnIcon = (track) => icon(`<div style="width:38px;height:38px;border-radius:50%;background:${RARITY_COLOR(track.rarity)};display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 14px ${RARITY_COLOR(track.rarity)};border:2px solid white;">${GENRE_EMOJI[track.genre] || '🎵'}</div>`)
const stopIcon = (lured) => icon(`<div style="width:32px;height:32px;border-radius:50%;background:${lured ? '#e879f9' : '#0ea5e9'};display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 0 10px ${lured ? '#e879f9' : '#0ea5e9'};">💿</div>`, 32)
const gymIcon = (team) => {
  const c = team === 'valor' ? '#ef4444' : team === 'mystic' ? '#3b82f6' : team === 'instinct' ? '#facc15' : '#64748b'
  return icon(`<div style="width:40px;height:40px;border-radius:12px;background:${c};display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid white;box-shadow:0 0 14px ${c};">🏟️</div>`, 40)
}
const userIcon = (avatar) => icon(`<div style="width:30px;height:30px;border-radius:50%;background:#06b6d4;border:3px solid white;box-shadow:0 0 0 8px rgba(6,182,212,0.25);display:flex;align-items:center;justify-content:center;font-size:15px;">${avatar}</div>`, 30)

// The map is locked to the player's avatar (like Pokémon GO): it cannot be
// panned, dragged, pinch/scroll-zoomed, or moved by popups. It only moves
// when the player's real (or simulated-walk) position changes, and any
// residual movement snaps straight back to the avatar.
function AvatarLock({ pos }) {
  const map = useMap()
  const snapping = useRef(false)
  // belt-and-braces: disable every Leaflet interaction handler on mount
  useEffect(() => {
    map.dragging?.disable()
    map.touchZoom?.disable()
    map.scrollWheelZoom?.disable()
    map.doubleClickZoom?.disable()
    map.boxZoom?.disable()
    map.keyboard?.disable()
    map.tapHold?.disable?.()
  }, [map])
  // follow the avatar
  useEffect(() => { if (pos) map.setView([pos.lat, pos.lng], 16, { animate: true }) }, [pos, map])
  // snap back if anything (popup autopan, inertia, zoom) shifts the center
  useEffect(() => {
    if (!pos) return
    const onMoveEnd = () => {
      if (snapping.current) { snapping.current = false; return }
      const c = map.getCenter()
      const off = distanceMeters({ lat: c.lat, lng: c.lng }, pos)
      if (off > 2) {
        snapping.current = true
        map.setView([pos.lat, pos.lng], 16, { animate: false })
      }
    }
    map.on('moveend', onMoveEnd)
    return () => { map.off('moveend', onMoveEnd) }
  }, [pos, map])
  return null
}

export default function MapScreen() {
  const navigate = useNavigate()
  const store = useStore()
  const { profile, spawns, pois, weather, effects } = store
  const [pos, setPos] = useState(null)
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)
  const lastPos = useRef(null)
  const toast = (t) => { setMsg(t); setTimeout(() => setMsg(null), 3500) }

  const ensureWorld = (center) => {
    const st = useStore.getState()
    st.setPois(generatePois(center))
    const now = Date.now()
    const alive = (st.spawns || []).filter(s => s.expires > now)
    if (alive.length < 10) {
      const pool = spawnPool({ weather: st.weather, radar: st.effects.radarUntil > now })
      const biome = biomeGenres(center.lat)
      const boosted = TRACK_BY_ID && Object.values(TRACK_BY_ID).filter(t => biome.includes(t.genre))
      const fresh = []
      for (let i = 0; i < 12 - alive.length; i++) {
        const useBiome = Math.random() < 0.35 && boosted.length
        const trackId = useBiome ? boosted[Math.floor(Math.random() * boosted.length)].id : pool[Math.floor(Math.random() * pool.length)]
        fresh.push(makeSpawn(center, trackId, effects.incenseUntil > now && i < 3 ? 'incense' : 'wild'))
      }
      store.setSpawns([...alive, ...fresh])
    }
  }

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) { setPos(DEFAULT_CENTER); setErr('No GPS — demo area (Kitchener)'); return }
    const fallback = setTimeout(() => { if (!lastPos.current) { setPos(DEFAULT_CENTER); setErr('Location timeout — demo area') } }, 4000)
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        clearTimeout(fallback)
        const c = { lat: p.coords.latitude, lng: p.coords.longitude }
        if (lastPos.current) {
          const d = distanceMeters(lastPos.current, c)
          if (d > 3 && d < 2000) {
            const hatched = store.addDistance(d)
            if (hatched?.length) toast(`🥚 Hatched ${TRACK_BY_ID[hatched[0].trackId]?.title}!`)
          }
        }
        lastPos.current = c; setPos(c)
      },
      () => { clearTimeout(fallback); if (!lastPos.current) { setPos(DEFAULT_CENTER); setErr('Location denied — demo area') } },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { if (pos) ensureWorld(pos) }, [pos?.lat && Math.round(pos.lat * 200), pos?.lng && Math.round(pos.lng * 200)]) // eslint-disable-line

  // spawn churn: expire + top up every 45s
  useEffect(() => {
    const iv = setInterval(() => { if (pos) { store.setSpawns(store.spawns.filter(s => s.expires > Date.now())); ensureWorld(pos) } }, 45000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos])

  const simulateWalk = () => {
    const hatched = store.addDistance(500)
    if (hatched?.length) toast(`🥚 Hatched ${TRACK_BY_ID[hatched[0].trackId]?.title}!`)
    else if (store.routeState.lastEvent) toast(store.routeState.lastEvent)
    else toast('+0.5 km walked (Adventure Sync)')
    if (pos) ensureWorld(pos)
  }

  const center = pos || DEFAULT_CENTER
  const events = activeEvents(); const cd = activeCommunityDay()
  const nearby = [...(spawns || [])].map(s => ({ ...s, dist: pos ? distanceMeters(pos, s) : 0, track: TRACK_BY_ID[s.trackId] })).filter(s => s.track).sort((a, b) => a.dist - b.dist)
  const bio = biomeGenres(center.lat)

  return (
    <div className="relative h-full">
      {err && <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[500] bg-amber-500/90 text-black text-[11px] px-3 py-1 rounded-full whitespace-nowrap">{err}</div>}
      {msg && <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/95 border border-fuchsia-500/50 text-xs px-3 py-2 rounded-xl whitespace-nowrap">{msg}</div>}

      <div className="absolute top-16 left-3 z-[500] glass rounded-2xl px-3 py-2 flex items-center gap-2 max-w-[240px]">
        <CloudSun size={18} className="text-amber-300 shrink-0" />
        <div>
          <div className="text-xs font-semibold">{weather?.icon} {weather?.name} · {weather?.temp}°C</div>
          <div className="text-[9px] text-slate-400">{weather?.desc} · Biome: {bio.join(' / ')}</div>
        </div>
        <button onClick={() => store.refreshWeather()} className="text-[10px] px-2 py-1 rounded-lg bg-white/10">↻</button>
      </div>

      {(effects.incenseUntil > Date.now() || effects.luckyEggUntil > Date.now() || effects.radarUntil > Date.now()) && (
        <div className="absolute top-16 right-3 z-[500] glass rounded-2xl px-2 py-1.5 text-[9px] space-y-0.5">
          {effects.incenseUntil > Date.now() && <div>🕯️ Incense</div>}
          {effects.luckyEggUntil > Date.now() && <div>🥚 2× XP</div>}
          {effects.radarUntil > Date.now() && <div>📡 Radar</div>}
        </div>
      )}

      <MapContainer center={[center.lat, center.lng]} zoom={16} minZoom={16} maxZoom={16} className="h-full w-full"
        zoomControl={false} dragging={false} touchZoom={false} scrollWheelZoom={false}
        doubleClickZoom={false} boxZoom={false} keyboard={false} inertia={false} zoomSnap={0}>
        <TileLayer attribution='Tiles &copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" />
        {pos && <Marker position={[pos.lat, pos.lng]} icon={userIcon(profile.avatar)} />}
        {pos && <Circle center={[pos.lat, pos.lng]} radius={80} pathOptions={{ color: '#22d3ee', weight: 1, fillOpacity: 0.06 }} />}
        {(pois || []).map(p => p.kind === 'stop' ? (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={stopIcon(p.lure && p.lure.until > Date.now())}>
            <Popup autoPan={false}><div className="text-black text-xs"><b>{p.name}</b><br />Amplifier Stop {p.grunt ? '· 🚨 Team Static spotted!' : ''}<br /><button onClick={() => navigate(`/stop/${p.id}`)} style={{ marginTop: 6, background: '#0ea5e9', color: '#fff', padding: '4px 10px', borderRadius: 8 }}>Visit</button></div></Popup>
          </Marker>
        ) : (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={gymIcon(p.gym?.team)}>
            <Popup autoPan={false}><div className="text-black text-xs"><b>{p.name}</b><br />Venue Gym {p.gym?.team ? `· ${p.gym.team}` : '· unclaimed'}<br /><button onClick={() => navigate(`/gym/${p.id}`)} style={{ marginTop: 6, background: '#a855f7', color: '#fff', padding: '4px 10px', borderRadius: 8 }}>Visit</button></div></Popup>
          </Marker>
        ))}
        {nearby.map(s => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={spawnIcon(s.track)} eventHandlers={{ click: () => navigate(`/encounter/${s.id}`) }}>
            <Popup autoPan={false}><div className="text-black text-xs"><b>{s.track.title}</b> · CP range<br />{s.track.artist} · {Math.round(s.dist)}m · {s.track.rarity}<br /><button onClick={() => navigate(`/encounter/${s.id}`)} style={{ marginTop: 6, background: '#d946ef', color: '#fff', padding: '4px 10px', borderRadius: 8 }}>Encounter</button></div></Popup>
          </Marker>
        ))}
        <AvatarLock pos={pos} />
      </MapContainer>

      {(events.length > 0 || cd) && (
        <button onClick={() => navigate('/events')} className="absolute top-[104px] left-3 z-[500] glass rounded-xl px-3 py-1.5 text-left">
          <div className="text-[10px] font-bold text-fuchsia-300">{cd ? `🌟 ${cd.name}` : `🎉 ${events[0].name}`}</div>
          <div className="text-[9px] text-slate-400">Tap for event bonuses</div>
        </button>
      )}

      <div className="absolute bottom-20 right-3 z-[500] flex flex-col gap-2">
        <button onClick={() => pos && ensureWorld(pos)} className="w-11 h-11 rounded-full glass flex items-center justify-center text-fuchsia-400"><RefreshCw size={19} /></button>
        <button onClick={simulateWalk} className="w-11 h-11 rounded-full glass flex items-center justify-center text-emerald-400" title="Simulate walk +0.5 km"><Footprints size={19} /></button>
        <button onClick={() => pos && setPos({ ...pos })} className="w-11 h-11 rounded-full glass flex items-center justify-center text-cyan-400"><Navigation size={19} /></button>
      </div>

      {/* Nearby tracker */}
      <div className="absolute bottom-20 left-3 right-16 z-[400]">
        <div className="glass rounded-2xl p-2">
          <div className="flex justify-between px-1"><span className="text-[10px] text-slate-400">🧭 Nearby tracker · 🔒 map follows you</span><span className="text-[9px] text-slate-500">{store.daily.catchStreak ? `🔥 Catch streak ${store.daily.catchStreak} · Stop streak ${store.daily.stopStreak}` : 'Catch & spin daily for streaks'}</span></div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-1">
            {nearby.slice(0, 9).map(s => (
              <button key={s.id} onClick={() => navigate(`/encounter/${s.id}`)} className="shrink-0 flex items-center gap-2 bg-slate-800/80 rounded-xl px-2 py-1.5">
                <span className="text-base">{s.track.genre === 'Pop' ? '🎤' : '🎵'}</span>
                <span className="text-left"><span className="block text-[11px] font-semibold max-w-[90px] truncate">{s.track.title}</span><span className="block text-[9px] text-slate-400">{Math.round(s.dist)}m · {s.track.rarity}{s.source !== 'wild' ? ` · ${s.source}` : ''}</span></span>
              </button>
            ))}
            {nearby.length === 0 && <span className="text-[11px] text-slate-400 px-1">Scanning…</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
