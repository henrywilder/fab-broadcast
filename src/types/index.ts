// -----------------------------------------------------------------------
// Shared TypeScript types used across the frontend and API routes.
// Defining types here means one place to update if the data structure changes.
// -----------------------------------------------------------------------

/** A player found on the FAB ELO leaderboard */
export interface Player {
  id: string;       // The GEM player ID that was searched
  name: string;     // Full display name (e.g. "Brodie Spurlock")
  elo: number;      // ELO Overall rating (e.g. 1970)
  rank: number;     // Their rank on the ELO leaderboard (e.g. 142)
  country: string;  // Two-letter country code (e.g. "US")
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
