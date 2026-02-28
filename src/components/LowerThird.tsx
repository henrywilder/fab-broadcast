// LowerThird.tsx — the actual broadcast graphic that appears on screen.
//
// This component is used in two places:
//   1. The /overlay page (full 1920×1080, captured by OBS)
//   2. The control panel preview (scaled down so the operator can see it)
//
// The graphic animates in from the bottom when shown, and fades out when cleared.
import type { Player } from '../types'

interface LowerThirdProps {
  player: Player | null
  visible: boolean
}

export default function LowerThird({ player, visible }: LowerThirdProps) {
  // Don't render anything if there's no player data at all
  // (visible:false with a player keeps the data on screen during the fade-out animation)
  if (!player && !visible) return null

  return (
    // The outer wrapper positions the graphic at the bottom-left of the screen
    <div
      className={`
        absolute bottom-14 left-14
        transition-all duration-700 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}
      `}
    >
      {/* Left accent bar + main panel */}
      <div className="flex items-stretch">

        {/* Bright amber left accent bar — the FAB brand colour */}
        <div className="w-1.5 bg-amber-400 rounded-l-sm flex-shrink-0" />

        {/* Main content panel */}
        <div
          className="
            bg-zinc-900/90 backdrop-blur-sm
            px-7 py-4
            border border-zinc-700/50 border-l-0
            rounded-r-sm
          "
        >
          {/* Player name — large, bold, all-caps */}
          <div className="text-white text-4xl font-bold tracking-widest uppercase leading-none">
            {player?.name ?? ''}
          </div>

          {/* ELO rating and rank — amber to match the accent */}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-amber-400 text-lg font-semibold tracking-wide">
              ELO {player?.elo?.toLocaleString() ?? ''}
            </span>
            <span className="text-zinc-500 text-sm">·</span>
            <span className="text-zinc-400 text-sm font-medium tracking-wide">
              RANK #{player?.rank?.toLocaleString() ?? ''}
            </span>
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
