// api/overlay.ts — Vercel serverless function for overlay state sync.
//
// Supports two independent overlay slots: player1 and player2.
// Each gets its own Redis key so they can be controlled independently
// and added as separate browser sources in OBS.
//
// Endpoints:
//   GET  /api/overlay?slot=player1   → returns Player 1 overlay state
//   GET  /api/overlay?slot=player2   → returns Player 2 overlay state
//   POST /api/overlay?slot=player1   → updates Player 1 overlay state
//   POST /api/overlay?slot=player2   → updates Player 2 overlay state
//
// If no slot is specified, defaults to player1.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

// Returns the correct Redis key for the given slot.
// Using separate keys means P1 and P2 states never interfere with each other.
function getOverlayKey(slot: string | string[] | undefined): string {
  if (slot === 'player2') return 'fab-broadcast:overlay-player2'
  return 'fab-broadcast:overlay-player1' // default to player1
}

// Initialize the Redis client using environment variables set in Vercel dashboard.
// These are NOT exposed to the browser — they only exist on the server.
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error(
      'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables. ' +
      'See .env.example for setup instructions.'
    )
  }

  return new Redis({ url, token })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow requests from any origin (needed for the browser to call this API)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle CORS preflight request (browsers send this before POST requests)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Which overlay slot are we working with? Defaults to player1.
  const OVERLAY_KEY = getOverlayKey(req.query.slot)

  // --- GET: return the current overlay state for this slot ---
  if (req.method === 'GET') {
    try {
      const redis = getRedis()
      const state = await redis.get(OVERLAY_KEY)

      // If no state has been set yet, return a sensible default (overlay hidden)
      return res.status(200).json({
        success: true,
        data: state ?? { player: null, visible: false },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Overlay GET error:', message)
      return res.status(500).json({ success: false, error: 'Could not read overlay state.' })
    }
  }

  // --- POST: update the overlay state for this slot ---
  if (req.method === 'POST') {
    try {
      const state = req.body

      // Basic validation — make sure we received a real object
      if (!state || typeof state !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid state object in request body.' })
      }

      const redis = getRedis()
      await redis.set(OVERLAY_KEY, state)

      return res.status(200).json({ success: true, data: state })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Overlay POST error:', message)
      return res.status(500).json({ success: false, error: 'Could not update overlay state.' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
