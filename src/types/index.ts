// -----------------------------------------------------------------------
// Shared TypeScript types used across the frontend and API routes.
// Defining types here means one place to update if the data structure changes.
// -----------------------------------------------------------------------

/** A player found via the FAB leaderboard API */
export interface Player {
  id: string;            // The GEM player ID that was searched
  name: string;          // Full display name (e.g. "Brodie Spurlock")
  elo: number | null;    // ELO Overall rating, or null if the player has no ELO rating
  rank: number | null;   // Their rank on the ELO leaderboard, or null if unrated
  country: string;       // Two-letter country code (e.g. "US")
}

/** The current state of the overlay — what OBS is showing right now */
export interface OverlayState {
  player: Player | null;  // The player to display, or null if cleared
  visible: boolean;       // Controls the show/hide animation
}

/**
 * Every API response follows this pattern.
 * On success: { success: true, data: T }
 * On failure: { success: false, error: "Human-readable message" }
 *
 * The frontend always checks `success` before using `data`.
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
