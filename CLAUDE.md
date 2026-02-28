# FAB Broadcast Graphics Tool — Claude Code Guide

## Project Overview

A web-based broadcast graphics creator for **Flesh and Blood TCG** streaming. The tool runs in a browser and outputs overlays designed to be captured by OBS as a browser source. The operator enters player data during a live broadcast and graphics are displayed as overlays.

The owner of this project has **no software development experience**. Claude should:
- Explain decisions clearly in plain language when making architectural choices
- Prefer simple, readable code over clever code
- Avoid unnecessary abstractions or premature optimisation
- Add comments throughout the code so a non-developer can understand what each section does
- When something could be done multiple ways, pick the most beginner-friendly and maintainable approach

---

## Tech Stack

- **Frontend**: React + TypeScript (via Vite)
- **Styling**: Tailwind CSS
- **Data fetching / scraping**: A small Node.js/Express backend server that handles all web scraping (this keeps CORS issues away from the browser)
- **Scraping library**: Playwright or Cheerio+node-fetch (prefer Playwright if the FAB leaderboard renders with JavaScript; prefer Cheerio if it's static HTML)
- **Overlay output**: A separate browser route (`/overlay`) that OBS points to as a browser source

Do not introduce additional frameworks, libraries, or services without explaining why they are needed.

---

## Project Structure

```
fab-broadcast/
├── client/                  # React frontend (operator control panel + overlay views)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/
│   │   │   ├── ControlPanel.tsx   # Operator UI — where data is entered
│   │   │   └── Overlay.tsx        # The actual graphic shown in OBS
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   └── App.tsx
├── server/                  # Node/Express backend
│   ├── scrapers/
│   │   └── fabLeaderboard.ts  # All FAB leaderboard scraping logic lives here
│   ├── routes/
│   │   └── player.ts          # API routes for player data
│   └── index.ts               # Server entry point
├── CLAUDE.md                  # This file
└── README.md
```

---

## Core Features (Build in This Order)

### 1. Player Lookup by GEM ID
- Operator enters a FAB Player ID (GEM ID) into the control panel
- The backend scrapes `https://fabtcg.com/en/leaderboards/` to find the player's **name** and **ELO rating**
- The leaderboard URL structure uses query params — the scraper should handle pagination and search
- Results are returned to the frontend and displayed in the control panel for confirmation before going live

### 2. Lower Third Overlay
- A separate page/route (`/overlay`) that OBS captures as a browser source at **1920×1080**
- Displays player name and ELO as a lower third graphic
- The overlay should be transparent-background by default (for chroma key / browser source use)
- Animate in/out smoothly when player data is set or cleared

### 3. Operator Control Panel
- Simple, clean UI for the operator
- Input field for GEM Player ID
- "Look up" button that triggers the scrape
- Preview of what the overlay currently shows
- "Send to overlay" button to push data live
- "Clear overlay" button to hide the graphic

---

## Scraping Guidelines — IMPORTANT

The FAB leaderboard at `https://fabtcg.com/en/leaderboards/` is the data source. There is **no official public API**.

### Scraping Rules
1. **Always scrape from the backend**, never from the browser directly (CORS will block it)
2. **Be resilient**: wrap all scraping logic in try/catch and return a clear error message if scraping fails, rather than crashing
3. **Cache results**: once a player ID is successfully scraped, cache the result in memory for the session (e.g. a simple JS Map) so repeat lookups don't hammer the site
4. **Respect the site**: add a reasonable delay between requests if multiple lookups happen quickly; do not build anything that bulk-scrapes the leaderboard
5. **Fail gracefully**: if the leaderboard page structure changes and scraping breaks, return a user-friendly error like "Could not retrieve player data — the leaderboard page may have changed" rather than a raw crash
6. **Document the selectors**: in the scraper file, add comments explaining what HTML elements/selectors are being targeted, so they're easy to update if FAB changes their site

### Known Data Points Available
- Player name
- ELO rating (Overall)
- Country (available but not required in v1)
- XP (available but not required in v1)

---

## OBS Integration Notes

- The overlay page (`/overlay`) must have a **transparent background** — use `background: transparent` on `<html>` and `<body>`
- Default overlay canvas size: **1920×1080**
- The overlay should work even when the control panel is on a different screen/machine — use WebSockets or polling to sync state between control panel and overlay
- Recommend WebSockets (via `socket.io`) as the simplest real-time sync solution
- The overlay should **not** require a page refresh to update — changes from the control panel push to the overlay in real time

---

## Code Quality Standards

- Use TypeScript throughout — define types for all player data, API responses, and component props
- Handle all async operations with proper loading states and error states
- Never show a blank screen to the operator — always show a loading spinner or error message
- Keep scraping logic isolated in `server/scrapers/` — do not mix it into route handlers
- Use environment variables for any configurable values (server port, etc.) via a `.env` file
- Include a `.env.example` file so setup is clear

---

## Error Handling Patterns

```typescript
// Always structure API responses consistently:
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

The frontend should always check `success` before using `data`.

---

## What NOT to Do

- Do not use `any` types in TypeScript — be explicit
- Do not store sensitive data (there is none currently, but maintain the habit)
- Do not make the overlay dependent on a database in v1 — in-memory state is fine to start
- Do not over-engineer: no microservices, no Docker, no CI/CD pipelines until explicitly asked
- Do not auto-deploy or push to any service without asking the operator first

---

## Running the Project

The project should be startable with two commands in two terminals:
1. `npm run dev` in `/server` — starts the Express backend
2. `npm run dev` in `/client` — starts the Vite dev server

Document both commands clearly in `README.md`.

---

## Future Features (Do Not Build Yet — For Context Only)

- Score / life total overlay
- Card art display panel
- Match bracket graphics
- Multiple player slots (Player 1 vs Player 2)
- Custom branding / theme support
- Card database integration (artwork lookup by card name)
