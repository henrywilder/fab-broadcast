// Overlay.tsx — the broadcast graphic page that OBS captures.
//
// OBS SETUP:
//   1. Add a Browser Source in OBS
//   2. Set the URL to: https://your-deployment.vercel.app/overlay
//   3. Set Width: 1920, Height: 1080
//   4. Check "Shutdown source when not visible"
//
// The page is 1920×1080 with a transparent background.
// It polls the server every second to pick up updates from the control panel.
import { useEffect } from 'react'
import { useOverlayState } from '../hooks/useOverlayState'
import LowerThird from '../components/LowerThird'

export default function Overlay() {
  const { state } = useOverlayState()

  // Make the page background transparent so OBS shows the game footage behind it.
  // This overrides the default dark background set in index.css.
  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'

    return () => {
      document.documentElement.style.background = ''
      document.body.style.background = ''
    }
  }, [])

  return (
    // The container is exactly 1920×1080 — the standard broadcast canvas size.
    // Everything is positioned relative to this container using `absolute` positioning.
    <div className="w-screen h-screen relative overflow-hidden">
      <LowerThird player={state.player} visible={state.visible} />
    </div>
  )
}
