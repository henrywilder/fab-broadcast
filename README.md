# FAB Broadcast Tool

A live broadcast overlay tool for **Flesh and Blood TCG** streaming.

The broadcaster opens a control panel in their browser, looks up a player by GEM ID, and sends their name and ELO rating to a graphic that OBS captures as a browser source.

**Zero install for the broadcaster** — they just open a URL.

---

## How It Works

```
Broadcaster types GEM ID
        ↓
Control panel fetches from /api/player
        ↓
FAB leaderboard API returns player name + ELO
        ↓
Broadcaster clicks "Send to Overlay"
        ↓
/api/overlay stores state in Upstash Redis
        ↓
OBS browser source polls /api/overlay every second
        ↓
Graphic appears on stream
```

---

## One-Time Setup (Done Once by the Project Owner)

### Step 1 — Install Node.js

Download and install from https://nodejs.org (LTS version)

### Step 2 — Install dependencies

Open a terminal in this folder and run:

```bash
npm install
```

### Step 3 — Create an Upstash Redis database (free)

1. Go to https://upstash.com and sign up (free)
2. Click **Create Database**
3. Give it any name, choose the region closest to you
4. On the database page, click the **REST API** tab
5. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` values

### Step 4 — Set up environment variables

Copy `.env.example` to a new file called `.env.local`:

```bash
cp .env.example .env.local
```

Open `.env.local` and paste in your Upstash values.

### Step 5 — Create a Vercel account and deploy

1. Go to https://vercel.com and sign up (free, use GitHub to log in)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy:
   ```bash
   vercel
   ```
   Follow the prompts. When asked about settings, accept the defaults.

4. Add your environment variables to Vercel:
   ```bash
   vercel env add UPSTASH_REDIS_REST_URL
   vercel env add UPSTASH_REDIS_REST_TOKEN
   ```
   Paste the values when prompted. Select **Production**, **Preview**, and **Development** for both.

5. Redeploy to apply the environment variables:
   ```bash
   vercel --prod
   ```

Your app is now live at a URL like `https://fab-broadcast-xxxx.vercel.app`.

---

## For the Broadcaster

Give them two things:

1. **Control panel URL**: `https://your-deployment.vercel.app/`
2. **OBS setup instructions** (below)

### OBS Setup

1. In OBS, click **+** under Sources → **Browser Source**
2. Set the URL to: `https://your-deployment.vercel.app/overlay`
3. Set **Width**: `1920`, **Height**: `1080`
4. Check **Shutdown source when not visible**
5. Click OK

That's it. The overlay updates automatically — no refresh needed.

---

## Local Development (Optional)

To run the app locally with live reload:

```bash
vercel dev
```

This starts both the frontend and the API routes on `http://localhost:3000`.

You'll need your `.env.local` file set up (Step 4 above) for the API routes to work.

---

## Project Structure

```
fab-broadcast/
├── api/
│   ├── player.ts       # Looks up a player by GEM ID via the FAB leaderboard API
│   └── overlay.ts      # Reads/writes the current overlay state in Upstash Redis
├── src/
│   ├── components/
│   │   └── LowerThird.tsx     # The broadcast graphic component
│   ├── hooks/
│   │   └── useOverlayState.ts # Polls /api/overlay every second
│   ├── pages/
│   │   ├── ControlPanel.tsx   # Operator UI
│   │   └── Overlay.tsx        # The OBS browser source page
│   ├── types/
│   │   └── index.ts           # Shared TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── .env.example        # Copy this to .env.local and fill in your values
├── vercel.json         # Vercel routing config
└── CLAUDE.md           # Developer guide for Claude Code
```
