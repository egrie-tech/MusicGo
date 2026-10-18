import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store/gameStore'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import MiniPlayer from './components/MiniPlayer'
import { usePlayer } from './utils/player'
import MapScreen from './screens/MapScreen'
import EncounterScreen from './screens/EncounterScreen'
import CollectionScreen from './screens/CollectionScreen'
import BattleScreen from './screens/BattleScreen'
import ProfileScreen from './screens/ProfileScreen'
import InventoryScreen from './screens/InventoryScreen'
import StopScreen from './screens/StopScreen'
import GymScreen from './screens/GymScreen'
import EggsScreen from './screens/EggsScreen'
import BuddyScreen from './screens/BuddyScreen'
import ResearchScreen from './screens/ResearchScreen'
import RaidsScreen from './screens/RaidsScreen'
import FriendsScreen from './screens/FriendsScreen'
import RoutesScreen from './screens/RoutesScreen'
import EventsScreen from './screens/EventsScreen'

export default function App() {
  const profile = useStore(s => s.profile)
  const playerState = usePlayer()
  const location = useLocation()
  const isEncounter = location.pathname.startsWith('/encounter')
  const playerVisible = !isEncounter && playerState.status !== 'idle'
  return (
    <div className="app-shell">
      {!isEncounter && <TopBar profile={profile} />}
      <div className="scroll-area" style={{ paddingTop: isEncounter ? 0 : 56, paddingBottom: isEncounter ? 0 : playerVisible ? 168 : 72 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/encounter/:spawnId" element={<EncounterScreen />} />
          <Route path="/stop/:poiId" element={<StopScreen />} />
          <Route path="/gym/:poiId" element={<GymScreen />} />
          <Route path="/collection" element={<CollectionScreen />} />
          <Route path="/battle" element={<BattleScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/inventory" element={<InventoryScreen />} />
          <Route path="/eggs" element={<EggsScreen />} />
          <Route path="/buddy" element={<BuddyScreen />} />
          <Route path="/research" element={<ResearchScreen />} />
          <Route path="/raids" element={<RaidsScreen />} />
          <Route path="/friends" element={<FriendsScreen />} />
          <Route path="/routes" element={<RoutesScreen />} />
          <Route path="/events" element={<EventsScreen />} />
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </div>
      {/* MiniPlayer hosts the YouTube iframe — it must stay mounted on the
          encounter screen too, or "Listen now" after a catch can never
          start playback (it docks at the top there instead, see MiniPlayer) */}
      <MiniPlayer />
      {!isEncounter && <BottomNav />}
    </div>
  )
}
