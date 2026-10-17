import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../store/store'
import { TRACKS } from '../data/tracks'
import { generateDrops, DEFAULT_CENTER } from '../utils/geo'
import { Navigation, RefreshCw } from 'lucide-react'

// fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeIcon(color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="width:38px;height:38px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 12px ${color};border:2px solid white;">${emoji}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

function userIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#06b6d4;border:3px solid white;box-shadow:0 0 0 6px rgba(6,182,212,0.25);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function Recenter({ pos }) {
  const map = useMap()
  useEffect(() => { if (pos) map.setView([pos.lat, pos.lng], map.getZoom()) }, [pos, map])
  return null
}

export default function MapScreen() {
  const navigate = useNavigate()
  const { drops, setDrops } = useStore()
  const [pos, setPos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const spawnDrops = (center) => {
    const base = generateDrops(center, 14, 300)
    // assign tracks by rarity weighting
    const weighted = []
    TRACKS.forEach(t => {
      const w = t.rarity === 'common' ? 5 : t.rarity === 'uncommon' ? 3 : t.rarity === 'rare' ? 2 : t.rarity === 'epic' ? 1 : 0.5
      for (let i = 0; i < Math.round(w * 2); i++) weighted.push(t.id)
    })
    const drops = base.map((d) => ({
      ...d,
      trackId: weighted[Math.floor(Math.random() * weighted.length)],
    }))
    setDrops(drops)
  }

  const locate = () => {
    setLoading(true)
    if (!navigator.geolocation) { setErr('Geolocation not supported'); loadDemoArea(); return }
    let done = false
    const finish = (c, e) => {
      if (done) return
      done = true
      if (c) { setPos(c); spawnDrops(c); setLoading(false) }
      else { if (e) setErr(e); loadDemoArea() }
    }
    const timer = setTimeout(() => finish(null, 'Location timeout — using demo area'), 3000)
    navigator.geolocation.getCurrentPosition(
      (p) => { clearTimeout(timer); finish({ lat: p.coords.latitude, lng: p.coords.longitude }) },
      () => { clearTimeout(timer); finish(null, 'Location denied — using demo area') },
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 }
    )
  }

  const loadDemoArea = () => {
    setPos(DEFAULT_CENTER)
    spawnDrops(DEFAULT_CENTER)
    setLoading(false)
  }

  useEffect(() => { locate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => {
    if (pos) spawnDrops(pos)
  }

  const handleCatch = (drop) => {
    if (drop.caught) return
    navigate(`/encounter/${drop.id}`)
  }

  // expire old drops
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now()
      setDrops(drops.filter(d => d.expires > now))
    }, 30000)
    return () => clearInterval(iv)
  }, [drops, setDrops])

  const center = pos || DEFAULT_CENTER

  return (
    <div className="relative h-full">
      {loading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80">
          <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-slate-300">Locating you...</p>
        </div>
      )}
      {err && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-amber-500/90 text-black text-xs px-3 py-1 rounded-full">{err}</div>}

      <MapContainer center={[center.lat, center.lng]} zoom={16} className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        {pos && <Marker position={[pos.lat, pos.lng]} icon={userIcon()} />}
        {drops.map(d => {
          const track = TRACKS.find(t => t.id === d.trackId)
          if (!track) return null
          const color = RARITY_COLOR(track.rarity)
          return (
            <Marker key={d.id} position={[d.lat, d.lng]} icon={makeIcon(color, genreEmoji(track.genre))}>
              <Popup>
                <div className="text-black">
                  <div className="font-bold">{track.title}</div>
                  <div className="text-xs">{track.artist} · {track.genre}</div>
                  <button onClick={() => handleCatch(d)} className="mt-2 px-3 py-1 bg-fuchsia-500 text-white rounded text-xs">Encounter</button>
                </div>
              </Popup>
            </Marker>
          )
        })}
        <Recenter pos={pos} />
      </MapContainer>

      {/* floating controls */}
      <div className="absolute bottom-20 right-3 z-40 flex flex-col gap-2">
        <button onClick={locate} className="w-11 h-11 rounded-full glass flex items-center justify-center text-cyan-400 shadow-lg">
          <Navigation size={20} />
        </button>
        <button onClick={refresh} className="w-11 h-11 rounded-full glass flex items-center justify-center text-fuchsia-400 shadow-lg">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* nearby list */}
      <div className="absolute bottom-20 left-3 right-16 z-30">
        <div className="glass rounded-2xl p-2 max-h-32 overflow-y-auto no-scrollbar">
          <div className="text-[10px] text-slate-400 mb-1 px-1">Nearby drops ({drops.length})</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {drops.slice(0, 8).map(d => {
              const track = TRACKS.find(t => t.id === d.trackId)
              if (!track) return null
              return (
                <button key={d.id} onClick={() => handleCatch(d)}
                  className="shrink-0 flex items-center gap-2 bg-slate-800/80 rounded-xl px-2 py-1.5 hover:bg-slate-700">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: `hsl(${track.hue},70%,40%)` }}>🎵</div>
                  <div className="text-left">
                    <div className="text-xs font-semibold truncate max-w-[90px]">{track.title}</div>
                    <div className="text-[10px] text-slate-400">{track.rarity}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function RARITY_COLOR(r) {
  return { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' }[r]
}
function genreEmoji(g) {
  return { Pop: '🎤', 'Hip-Hop': '🎧', Rock: '🎸', Electronic: '🎹', Jazz: '🎷', Classical: '🎻', Indie: '🍂', 'R&B': '💜', Latin: '💃', 'K-Pop': '⭐' }[g] || '🎵'
}
