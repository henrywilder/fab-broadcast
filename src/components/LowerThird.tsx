// LowerThird.tsx — the actual broadcast graphic that appears on screen.
//
// This component is used in two places:
//   1. The /overlay/player1 and /overlay/player2 pages (full 1920×1080, captured by OBS)
//   2. The control panel preview (scaled down so the operator can see it)
//
// The `side` prop controls where the card is anchored:
//   'left'  → bottom-left  (Player 1 default)
//   'right' → bottom-right (Player 2 default)
//
// The graphic animates in from the bottom when shown, and fades out when cleared.
import type { Player } from '../types'

interface LowerThirdProps {
  player: Player | null
  visible: boolean
  side?: 'left' | 'right'  // defaults to 'left'
}

export default function LowerThird({ player, visible, side = 'left' }: LowerThirdProps) {
  // Don't render anything if there's no player data at all
  // (visible:false with a player keeps the data on screen during the fade-out animation)
  if (!player && !visible) return null

  const isRight = side === 'right'

  return (
    // The outer wrapper positions the graphic at the bottom of the screen
    <div
      className={`
        absolute bottom-14
        ${isRight ? 'right-14' : 'left-14'}
        transition-all duration-700 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}
      `}
    >
      {/* Accent bar + main panel — layout mirrors for the right side */}
      <div className={`flex items-stretch ${isRight ? 'flex-row-reverse' : ''}`}>

        {/* Bright amber accent bar — the FAB brand colour */}
        <div className={`w-1.5 bg-amber-400 flex-shrink-0 ${isRight ? 'rounded-r-sm' : 'rounded-l-sm'}`} />

        {/* Main content panel */}
        <div
          className={`
            bg-zinc-900/90 backdrop-blur-sm
            px-7 py-4
            border border-zinc-700/50
            ${isRight ? 'border-r-0 rounded-l-sm text-right' : 'border-l-0 rounded-r-sm text-left'}
          `}
        >
          {/* Player name — large, bold, all-caps */}
          <div className="text-white text-4xl font-bold tracking-widest uppercase leading-none">
            {player?.name ?? ''}
          </div>

          {/* ELO rating and rank — amber to match the accent */}
          <div className={`flex items-center gap-4 mt-2 ${isRight ? 'justify-end' : ''}`}>
            <span className="text-amber-400 text-lg font-semibold tracking-wide">
              {player?.elo != null ? `ELO ${player.elo.toLocaleString()}` : 'Unrated'}
            </span>
            {player?.rank != null && (
              <>
                <span className="text-zinc-500 text-sm">·</span>
                <span className="text-zinc-400 text-sm font-medium tracking-wide">
                  RANK #{player.rank.toLocaleString()}
                </span>
              </>
            )}
            {player?.country && (
              <>
                <span className="text-zinc-500 text-sm">·</span>
                <span className="text-zinc-400 text-sm font-medium tracking-wide uppercase">
                  {player.country}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
