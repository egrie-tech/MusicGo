import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { VENUES } from '../data/venues'
import { Trophy, Swords } from 'lucide-react'

export default function VenueScreen() {
  const { venueId } = useParams()
  const navigate = useNavigate()
  const venues = useStore(s => s.venues) || {}
  const venue = VENUES.find(v => v.id === venueId)
  const state = venues[venueId]

  if (!venue) return <div className="p-6">Venue not found</div>

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => navigate('/map')} className="text-slate-400 text-sm">← Back</button>
      <div className="glass rounded-3xl p-6 text-center" style={{ borderTop: `4px solid ${venue.color}` }}>
        <div className="text-5xl mb-2">🏟️</div>
        <h1 className="text-xl font-bold">{venue.name}</h1>
        <p className="text-sm text-slate-400">{venue.type} · Reward: {venue.reward} coins</p>
      </div>

      {state ? (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2"><Trophy size={16} className="text-amber-400" /><span className="font-semibold">Controlled by {state.owner}</span></div>
          <p className="text-xs text-slate-400">Level {state.level} · Claimed {new Date(state.claimedAt).toLocaleDateString()}</p>
          <button onClick={() => navigate('/battle')} className="mt-3 w-full py-3 rounded-2xl bg-red-600 font-bold flex items-center justify-center gap-2">
            <Swords size={16} /> Challenge
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-slate-400 text-sm mb-3">This venue is unclaimed. Win a battle to claim it!</p>
          <button onClick={() => navigate('/battle')} className="w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold">
            Battle to Claim
          </button>
        </div>
      )}
    </div>
  )
}
