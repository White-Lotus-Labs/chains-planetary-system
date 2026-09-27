# Chains Planetary System

A real-time 3D visualization of the multi-chain crypto ecosystem, built for the Nansen Meridian hackathon. Each blockchain is rendered as a planet whose size, orbit speed, and status reflect live on-chain data — turning abstract protocol metrics into something you can navigate and feel.

Press **[C]** to enter **Cinematic Tour** — an autonomous presentation mode that flies through the system, spotlighting each chain and its capital migration flows.

---

## Nansen API Endpoints

| Endpoint | Method | Used for |
|---|---|---|
| `POST /api/v1/chains/chain-rank` | POST | Fetches per-chain TVL, 24h DEX volume, transaction count, active addresses, and revenue — used to size planets, set orbit speeds, and compute bullish/bearish momentum signals. |
| `POST /api/v1/smart-money/holdings` | POST | Fetches smart money token holdings per chain — displayed in the chain spotlight card as "Smart Money Focus" tokens with 24h change. |

Data is shipped with fallback snapshots (`src/data/chains-cache.json`, `src/data/holdings-cache.json`) for offline use. When `NANSEN_API_KEY` is set, each request loads the latest data from Nansen and caches the upstream responses for five minutes. The UI's refresh action bypasses that cache and requests fresh data immediately; if a live request fails, the bundled snapshots are used.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, webpack) |
| UI | React 19, Tailwind CSS v4 |
| 3D Engine | Three.js, `@react-three/fiber`, `@react-three/drei` |
| Icons | Lucide React |
| Language | TypeScript 5 |
| Package manager | pnpm |

---

## Running locally

```bash
# 1. Install dependencies
pnpm install

# 2. (Optional) Add your Nansen API key for live data refresh
echo "NANSEN_API_KEY=your_key_here" > .env.local

# 3. Start dev server
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001).

### Other commands

```bash
pnpm build   # Production build
pnpm start   # Start production server
pnpm lint    # ESLint check
```

---

## Controls

| Key / Action | Effect |
|---|---|
| Drag | Orbit camera |
| Scroll | Zoom |
| Click planet | Open chain telemetry panel |
| `C` | Toggle Cinematic Tour |
| `Space` | Next slide (in Cinematic Tour) |
| `P` | Pause / resume (in Cinematic Tour) |
| `Esc` | Exit Cinematic Tour / close panel |
