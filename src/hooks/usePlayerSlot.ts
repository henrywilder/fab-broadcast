// usePlayerSlot.ts — manages all state and actions for one player slot.
//
// Both Player 1 and Player 2 sections in the control panel do exactly the same
// things: look up a player, send them to the overlay, clear the overlay.
// This hook bundles that logic so we don't write it twice.
//
// Usage:
//   const p1 = usePlayerSlot('player1')
//   const p2 = usePlayerSlot('player2')
//
// The slot is passed to the API so each player has their own independent overlay.
import { useState } from 'react'
import type { Player, ApiResponse, OverlayState } from '../types'

export function usePlayerSlot(slot: 'player1' | 'player2') {
  // The GEM ID the operator has typed into the input field
  const [gemId, setGemId] = useState('')

  // The player returned from the last successful lookup
  const [lookedUpPlayer, setLookedUpPlayer] = useState<Player | null>(null)

  // The player currently live on this slot's overlay
  const [livePlayer, setLivePlayer] = useState<Player | null>(null)
  const [liveVisible, setLiveVisible] = useState(false)

  // UI status flags
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)

  // --- Fetch player data from the FAB leaderboard ---
  async function handleLookup() {
    const trimmedId = gemId.trim()
    if (!trimmedId) return

    setIsLookingUp(true)
    setLookupError(null)
    setLookedUpPlayer(null)

    try {
      const res = await fetch(`/api/player?id=${encodeURIComponent(trimmedId)}`)
      const json: ApiResponse<Player> = await res.json()

      if (json.success) {
        setLookedUpPlayer(json.data)
      } else {
        setLookupError(json.error)
      }
    } catch {
      setLookupError('Network error — could not reach the server. Try again.')
    } finally {
      setIsLookingUp(false)
    }
  }

  // --- Push the looked-up player to this slot's live overlay ---
  async function handleSendToOverlay() {
    if (!lookedUpPlayer) return

    setIsSending(true)
    setSendError(null)
    setSendSuccess(false)

    const newState: OverlayState = { player: lookedUpPlayer, visible: true }

    try {
      const res = await fetch(`/api/overlay?slot=${slot}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      })
      const json: ApiResponse<OverlayState> = await res.json()

      if (json.success) {
        setLivePlayer(lookedUpPlayer)
        setLiveVisible(true)
        setSendSuccess(true)
        setTimeout(() => setSendSuccess(false), 3000) // Clear success message after 3 seconds
      } else {
        setSendError(json.error)
      }
    } catch {
      setSendError('Network error — could not update the overlay. Try again.')
    } finally {
      setIsSending(false)
    }
  }

  // --- Hide this slot's overlay graphic ---
  async function handleClearOverlay() {
    setIsSending(true)
    setSendError(null)

    // Keep the player data but set visible:false so the graphic animates out
    const newState: OverlayState = { player: livePlayer, visible: false }

    try {
      const res = await fetch(`/api/overlay?slot=${slot}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      })
      const json: ApiResponse<OverlayState> = await res.json()

      if (json.success) {
        setLiveVisible(false)
        // After the animation finishes, clear the player data too
        setTimeout(() => setLivePlayer(null), 800)
      } else {
        setSendError(json.error)
      }
    } catch {
      setSendError('Network error — could not clear the overlay. Try again.')
    } finally {
      setIsSending(false)
    }
  }

  // Allow pressing Enter in the GEM ID input to trigger the lookup
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLookup()
  }

  return {
    gemId,
    setGemId,
    lookedUpPlayer,
    livePlayer,
    liveVisible,
    isLookingUp,
    isSending,
    lookupError,
    sendError,
    sendSuccess,
    handleLookup,
    handleSendToOverlay,
    handleClearOverlay,
    handleKeyDown,
  }
}
