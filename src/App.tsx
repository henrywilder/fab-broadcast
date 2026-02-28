// App.tsx — sets up the two routes for the application:
//   /         → ControlPanel (what the broadcaster sees)
//   /overlay  → Overlay (what OBS captures)
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ControlPanel from './pages/ControlPanel'
import Overlay from './pages/Overlay'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The operator control panel — the broadcaster types in player IDs here */}
        <Route path="/" element={<ControlPanel />} />

        {/* The broadcast overlay — OBS points its browser source here */}
        <Route path="/overlay" element={<Overlay />} />
      </Routes>
    </BrowserRouter>
  )
}
