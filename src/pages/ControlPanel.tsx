// ControlPanel.tsx — the operator's interface during a live broadcast.
//
// Each player has an independent section:
//   1. Type their GEM Player ID and click "Look Up"
//   2. Review the result
//   3. Click "Send to Overlay" — pushes their card live to OBS
//   4. Click "Clear" when done — hides the graphic in OBS
//
// Player 1 overlay → /overlay/player1 (card anchored bottom-left in OBS)
// Player 2 overlay → /overlay/player2 (card anchored bottom-right in OBS)
import { usePlayerSlot } from '../hooks/usePlayerSlot'
import LowerThird from '../components/LowerThird'

// --- PlayerSection ---
// A self-contained UI block for one player. Handles its own state via usePlayerSlot.
function PlayerSection({
  label,
  slot,
  side,
}: {
  label: string
  slot: 'player1' | 'player2'
  side: 'left' | 'right'
}) {
  const {
    gemId, setGemId,
    lookedUpPlayer, livePlayer, liveVisible,
    isLookingUp, isSending,
    lookupError, sendError, sendSuccess,
    handleLookup, handleSendToOverlay, handleClearOverlay, handleKeyDown,
  } = usePlayerSlot(slot)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">

      {/* Section header with player label */}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </h2>

      {/* GEM ID input row */}
      <div className="flex gap-3">
        <input
          type="text"
          value={gemId}
          onChange={e => setGemId(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="GEM Player ID (e.g. 78449312)"
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
            px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md
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

      {/* Player result card — shown after a successful lookup */}
      {lookedUpPlayer && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-md px-5 py-4 space-y-1">
          <div className="text-white font-bold text-lg tracking-wide">
            {lookedUpPlayer.name}
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-amber-400 font-semibold">
              {lookedUpPlayer.elo != null ? `ELO ${lookedUpPlayer.elo.toLocaleString()}` : 'Unrated'}
            </span>
            {lookedUpPlayer.rank != null && (
              <>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400">Rank #{lookedUpPlayer.rank.toLocaleString()}</span>
              </>
            )}
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400 uppercase">{lookedUpPlayer.country}</span>
          </div>
          <div className="text-zinc-600 text-xs">ID: {lookedUpPlayer.id}</div>
        </div>
      )}

      {/* Overlay control buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSendToOverlay}
          disabled={!lookedUpPlayer || isSending}
          className="
            flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-md
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isSending ? 'Sending…' : '▶  Send to Overlay'}
        </button>

        <button
          onClick={handleClearOverlay}
          disabled={!liveVisible || isSending}
          className="
            px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-md
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

      {/* Current live status indicator */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${liveVisible ? 'bg-green-400' : 'bg-zinc-600'}`} />
        {liveVisible && livePlayer
          ? `Live: ${livePlayer.name} (${livePlayer.elo != null ? `ELO ${livePlayer.elo.toLocaleString()}` : 'Unrated'})`
          : 'Overlay is hidden'}
      </div>

      {/*
        Mini preview — a small 16:9 thumbnail showing what this player's card looks like.
        Scales down the LowerThird so the operator can see the graphic style at a glance.
      */}
      <div
        className="relative bg-zinc-950 rounded-md overflow-hidden border border-zinc-800"
        style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}
      >
        <div className="absolute inset-0">
          {/* Simulated broadcast background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 opacity-50" />
          <LowerThird player={livePlayer} visible={liveVisible} side={side} />
        </div>
      </div>

    </div>
  )
}

// --- ControlPanel ---
// The main page. Renders two PlayerSection columns side by side.
export default function ControlPanel() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-amber-400">
            FAB Broadcast Tool
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Flesh and Blood TCG — Live Overlay Controller
          </p>
        </div>

        {/* Two player sections side by side */}
        <div className="grid grid-cols-2 gap-6">
          <PlayerSection label="Player 1" slot="player1" side="left" />
          <PlayerSection label="Player 2" slot="player2" side="right" />
        </div>

        {/* ── OBS Setup Reminder ── */}
        <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-5 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            OBS Setup
          </h2>
          <p className="text-zinc-500 text-xs leading-relaxed">
            In OBS: <strong className="text-zinc-400">Add Source → Browser Source</strong> — add one source per player.<br />
            Player 1 URL: <code className="text-amber-500/80">{window.location.origin}/overlay/player1</code><br />
            Player 2 URL: <code className="text-amber-500/80">{window.location.origin}/overlay/player2</code><br />
            Width: <strong className="text-zinc-400">1920</strong> · Height: <strong className="text-zinc-400">1080</strong>
          </p>
        </section>

      </div>
    </div>
  )
}
