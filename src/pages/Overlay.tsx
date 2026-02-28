// Overlay.tsx — the broadcast graphic page that OBS captures.
//
// There are two overlay URLs — one per player:
//   /overlay/player1  →  Player 1's card, anchored bottom-left
//   /overlay/player2  →  Player 2's card, anchored bottom-right
//
// OBS SETUP:
//   Add two Browser Sources in OBS, one for each player:
//   URL: https://your-deployment.vercel.app/overlay/player1
//   URL: https://your-deployment.vercel.app/overlay/player2
//   Width: 1920, Height: 1080
//   Check "Shutdown source when not visible"
//
// The page has a transparent background so OBS shows game footage behind it.
// It polls the server every second to pick up updates from the control panel.
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useOverlayState } from '../hooks/useOverlayState'
import LowerThird from '../components/LowerThird'

export default function Overlay() {
  // Read which player slot this overlay is for from the URL
  const { slot } = useParams<{ slot: string }>()
  const playerSlot = slot === 'player2' ? 'player2' : 'player1'

  const { state } = useOverlayState(playerSlot)

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
      <LowerThird
        player={state.player}
        visible={state.visible}
        side={playerSlot === 'player2' ? 'right' : 'left'}
      />
    </div>
  )
}
