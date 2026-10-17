import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/gameStore'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import MapScreen from './screens/MapScreen'
import EncounterScreen from './screens/EncounterScreen'
import CollectionScreen from './screens/CollectionScreen'
import BattleScreen from './screens/BattleScreen'
import ProfileScreen from './screens/ProfileScreen'
import InventoryScreen from './screens/InventoryScreen'
import VenueScreen from './screens/VenueScreen'

export default function App() {
  const profile = useStore(s => s.profile) || { level: 1, xp: 0, avatar: '🎧', name: 'Player', title: 'Rookie Listener', coins: 0 }
  return (
    <div className="app-shell">
      <TopBar profile={profile} />
      <div className="scroll-area" style={{ paddingTop: 56, paddingBottom: 72 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/encounter/:dropId" element={<EncounterScreen />} />
          <Route path="/collection" element={<CollectionScreen />} />
          <Route path="/battle" element={<BattleScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/inventory" element={<InventoryScreen />} />
          <Route path="/venue/:venueId" element={<VenueScreen />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}
