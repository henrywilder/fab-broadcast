// api/overlay.ts — Vercel serverless function for overlay state sync.
//
// This is the "shared memory" between the control panel and OBS overlay.
// Because the control panel and OBS are separate browsers, they can't
// communicate directly. Instead:
//   - The control panel writes state here (POST)
//   - The overlay reads state from here (GET) every second
//
// State is stored in Upstash Redis — a free, cloud-hosted key-value store.
//
// Endpoints:
//   GET  /api/overlay        → returns current overlay state
//   POST /api/overlay        → updates overlay state (body: { player, visible })
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

// The Redis key we use to store the overlay state
const OVERLAY_KEY = 'fab-broadcast:overlay-state'

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

  // --- GET: return the current overlay state ---
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

  // --- POST: update the overlay state ---
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
