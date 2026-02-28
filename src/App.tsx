// App.tsx — sets up routes for the application:
//   /                  → ControlPanel (what the broadcaster sees)
//   /overlay/player1   → Player 1 overlay (OBS browser source, bottom-left)
//   /overlay/player2   → Player 2 overlay (OBS browser source, bottom-right)
//   /overlay           → Redirects to /overlay/player1 (backwards compatibility)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ControlPanel from './pages/ControlPanel'
import Overlay from './pages/Overlay'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The operator control panel — the broadcaster manages both players here */}
        <Route path="/" element={<ControlPanel />} />

        {/* Player-specific broadcast overlays — OBS adds one browser source per player */}
        <Route path="/overlay/:slot" element={<Overlay />} />

        {/* Legacy /overlay route — redirects to player1 overlay */}
        <Route path="/overlay" element={<Navigate to="/overlay/player1" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
