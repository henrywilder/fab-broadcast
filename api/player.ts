// api/player.ts — Vercel serverless function for player lookup.
//
// Why this exists as a server-side function:
//   Browsers block direct requests to fabtcg.com due to CORS restrictions.
//   This function runs on the server, fetches the FAB API without CORS issues,
//   and returns the player data to the browser.
//
// Endpoint: GET /api/player?id=GEMID
import type { VercelRequest, VercelResponse } from '@vercel/node'

// The official FAB leaderboard API (discovered by inspecting the leaderboard page)
const FAB_API_URL = 'https://fabtcg.com/api/fab/v1/leaderboard/'

// Simple in-memory cache so repeat lookups of the same player don't hit the FAB API
// Note: this cache resets each time the serverless function cold-starts, which is fine
const cache = new Map<string, { data: PlayerResult; fetchedAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // Cache results for 5 minutes

interface PlayerResult {
  id: string
  name: string
  elo: number
  rank: number
  country: string
}

// This is the shape of each result returned by the FAB leaderboard API
interface FabLeaderboardResult {
  rank: number
  player_id: string
  player_full_name: string
  country: string
  score: number
  rank_type: string
}

interface FabApiResponse {
  count: number
  results: FabLeaderboardResult[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only GET requests are supported
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // Validate the player ID parameter
  const { id } = req.query
  if (!id || typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({ success: false, error: 'A player ID is required.' })
  }

  const playerId = id.trim()

  // --- Check cache first ---
  const cached = cache.get(playerId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return res.status(200).json({ success: true, data: cached.data })
  }

  // --- Fetch from the FAB leaderboard API ---
  // Parameters:
  //   rank_type=ELO  → only return ELO rating (not XP, World Tour, etc.)
  //   search=ID      → filter to this specific player ID
  const url = `${FAB_API_URL}?rank_type=ELO&search=${encodeURIComponent(playerId)}`

  let fabResponse: Response
  try {
    // The FAB API blocks requests that don't look like they're coming from a real browser.
    // These headers mimic what a browser sends when visiting the leaderboard page normally.
    fabResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://fabtcg.com/en/leaderboards/',
        'Origin': 'https://fabtcg.com',
      },
    })
  } catch {
    return res.status(502).json({
      success: false,
      error: 'Could not reach the FAB leaderboard. Check your internet connection and try again.',
    })
  }

  if (!fabResponse.ok) {
    return res.status(502).json({
      success: false,
      error: `The FAB leaderboard returned an error (${fabResponse.status}). Try again in a moment.`,
    })
  }

  let fabData: FabApiResponse
  try {
    fabData = await fabResponse.json() as FabApiResponse
  } catch {
    return res.status(502).json({
      success: false,
      error: 'Could not read data from the FAB leaderboard. The page format may have changed.',
    })
  }

  // --- Find the matching player ---
  if (!fabData.results || fabData.results.length === 0) {
    return res.status(404).json({
      success: false,
      error: `No player found with ID "${playerId}". Double-check the GEM ID and try again.`,
    })
  }

  // The API returns multiple results when searching by ID across all rank types.
  // We've already filtered to rank_type=ELO, so there should be exactly one result.
  const match = fabData.results[0]

  const result: PlayerResult = {
    id: playerId,
    name: match.player_full_name,
    elo: match.score,
    rank: match.rank,
    country: match.country,
  }

  // Save to cache
  cache.set(playerId, { data: result, fetchedAt: Date.now() })

  return res.status(200).json({ success: true, data: result })
}
