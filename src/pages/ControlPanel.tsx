// ControlPanel.tsx — the operator's interface during a live broadcast.
//
// Workflow:
//   1. Type a GEM Player ID into the input field
//   2. Click "Look Up" — fetches the player's name and ELO from the FAB leaderboard
//   3. Review the result
//   4. Click "Send to Overlay" — pushes the player data live to OBS
//   5. Click "Clear Overlay" when done — hides the graphic in OBS
import { useState } from 'react'
import type { Player, ApiResponse, OverlayState } from '../types'
import LowerThird from '../components/LowerThird'

export default function ControlPanel() {
  // --- State ---

  // What the operator has typed into the player ID input
  const [gemId, setGemId] = useState('')

  // The player returned from the last successful lookup
  const [lookedUpPlayer, setLookedUpPlayer] = useState<Player | null>(null)

  // The player currently live on the overlay (confirmed by clicking "Send to Overlay")
  const [livePlayer, setLivePlayer] = useState<Player | null>(null)
  const [liveVisible, setLiveVisible] = useState(false)

  // UI status flags
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)

  // --- Handlers ---

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

  async function handleSendToOverlay() {
    if (!lookedUpPlayer) return

    setIsSending(true)
    setSendError(null)
    setSendSuccess(false)

    const newState: OverlayState = { player: lookedUpPlayer, visible: true }

    try {
      const res = await fetch('/api/overlay', {
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

  async function handleClearOverlay() {
    setIsSending(true)
    setSendError(null)

    // Keep the player data but hide the graphic (so it animates out)
    const newState: OverlayState = { player: livePlayer, visible: false }

    try {
      const res = await fetch('/api/overlay', {
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

  // Allow pressing Enter to trigger the lookup
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLookup()
  }

  // --- Render ---

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-amber-400">
            FAB Broadcast Tool
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Flesh and Blood TCG — Live Overlay Controller
          </p>
        </div>

        {/* ── Player Lookup ── */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Player Lookup
          </h2>

          {/* GEM ID input row */}
          <div className="flex gap-3">
            <input
              type="text"
              value={gemId}
              onChange={e => setGemId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter GEM Player ID (e.g. 78449312)"
              className="
                flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2.5
                text-white placeholder-zinc-500
                focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                transition-colors
              "
            />
            <button
              onClick={handleLookup}
              disabled={isLookingUp || !gemId.trim()}
              className="
                px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors whitespace-nowrap
              "
            >
              {isLookingUp ? 'Looking up…' : 'Look Up'}
            </button>
          </div>

          {/* Lookup error */}
          {lookupError && (
            <div className="bg-red-950/50 border border-red-800 rounded-md px-4 py-3 text-red-300 text-sm">
              {lookupError}
            </div>
          )}

          {/* Player result */}
          {lookedUpPlayer && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-md px-5 py-4 space-y-1">
              <div className="text-white font-bold text-xl tracking-wide">
                {lookedUpPlayer.name}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-amber-400 font-semibold">
                  ELO {lookedUpPlayer.elo.toLocaleString()}
                </span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400">Rank #{lookedUpPlayer.rank.toLocaleString()}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400 uppercase">{lookedUpPlayer.country}</span>
              </div>
              <div className="text-zinc-600 text-xs mt-1">ID: {lookedUpPlayer.id}</div>
            </div>
          )}
        </section>

        {/* ── Overlay Controls ── */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Overlay Controls
          </h2>

          <div className="flex gap-3">
            {/* Send to overlay — only enabled when a player has been looked up */}
            <button
              onClick={handleSendToOverlay}
              disabled={!lookedUpPlayer || isSending}
              className="
                flex-1 px-5 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-md
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {isSending ? 'Sending…' : '▶  Send to Overlay'}
            </button>

            {/* Clear overlay — only enabled when something is live */}
            <button
              onClick={handleClearOverlay}
              disabled={!liveVisible || isSending}
              className="
                px-5 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-md
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors
              "
            >
              ✕  Clear
            </button>
          </div>

          {/* Success / error feedback */}
          {sendSuccess && (
            <div className="bg-green-950/50 border border-green-800 rounded-md px-4 py-3 text-green-300 text-sm">
              Overlay updated — graphic is now live in OBS.
            </div>
          )}
          {sendError && (
            <div className="bg-red-950/50 border border-red-800 rounded-md px-4 py-3 text-red-300 text-sm">
              {sendError}
            </div>
          )}

          {/* Current live status */}
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span
              className={`w-2 h-2 rounded-full ${liveVisible ? 'bg-green-400' : 'bg-zinc-600'}`}
            />
            {liveVisible && livePlayer
              ? `Live: ${livePlayer.name} (ELO ${livePlayer.elo.toLocaleString()})`
              : 'Overlay is hidden'}
          </div>
        </section>

        {/* ── Overlay Preview ── */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Preview
          </h2>
          <p className="text-zinc-600 text-xs">
            This is a scaled-down preview of what the OBS overlay looks like.
          </p>

          {/*
            The overlay is designed for 1920×1080.
            We scale it down to fit the preview area using CSS transform.
            The outer div reserves the correct height for the scaled content.
          */}
          <div
            className="relative bg-zinc-950 rounded-md overflow-hidden border border-zinc-800"
            style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: 'scale(1)',
                transformOrigin: 'top left',
                width: '100%',
                height: '100%',
              }}
            >
              {/* Simulated broadcast background hint */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 opacity-50" />

              {/* The actual lower third component, scaled to fit */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  // Scale the 1920×1080 design down to fit the preview container
                  // We render at the preview container's size, so the component uses relative units
                }}
              >
                <LowerThird player={livePlayer} visible={liveVisible} />
              </div>
            </div>
          </div>
        </section>

        {/* ── OBS Setup Reminder ── */}
        <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-5 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            OBS Setup
          </h2>
          <p className="text-zinc-500 text-xs leading-relaxed">
            In OBS: <strong className="text-zinc-400">Add Source → Browser Source</strong><br />
            URL: <code className="text-amber-500/80">{window.location.origin}/overlay</code><br />
            Width: <strong className="text-zinc-400">1920</strong> · Height: <strong className="text-zinc-400">1080</strong>
          </p>
        </section>

      </div>
    </div>
  )
}
