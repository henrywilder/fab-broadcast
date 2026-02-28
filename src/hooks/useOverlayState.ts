// useOverlayState.ts — a custom React hook that keeps the overlay in sync.
//
// How it works:
//   - Every second, it asks the server "what should the overlay be showing right now?"
//   - The server reads from Upstash Redis, which the control panel writes to
//   - This means both the control panel and the OBS overlay stay in sync,
//     even though they're separate browser windows
import { useState, useEffect } from 'react'
import type { OverlayState, ApiResponse } from '../types'

const POLL_INTERVAL_MS = 1000 // Check for updates every 1 second

export function useOverlayState() {
  const [state, setState] = useState<OverlayState>({ player: null, visible: false })
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    let active = true // Used to prevent state updates after the component unmounts

    async function fetchState() {
      try {
        const res = await fetch('/api/overlay')
        const json: ApiResponse<OverlayState> = await res.json()

        if (!active) return

        if (json.success) {
          setState(json.data)
          setConnectionError(null) // Clear any previous error
        } else {
          setConnectionError(json.error)
        }
      } catch {
        // Network error — the server might be temporarily unreachable
        if (active) {
          setConnectionError('Cannot reach the server. Check your connection.')
        }
      }
    }

    fetchState() // Run immediately on mount

    const interval = setInterval(fetchState, POLL_INTERVAL_MS)

    // Cleanup: stop polling when the component is removed from the page
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return { state, connectionError }
}
