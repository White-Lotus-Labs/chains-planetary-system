# 🪐 Nansen Cosmos — The 3D Multichain Universe

> **An astrophysical 3D simulation of onchain capital, Smart Money orbits, and cross-chain liquidity dynamics powered by the Nansen API.**  
> Built for the **[Nansen Meridian Buildathon](https://nansen.ai/campaigns/meridian-buildathon)** (September 2026).

---

## 🌌 Overview

Most blockchain analytics tools trap data inside flat, lifeless tables and repetitive 2D charts. 

**Nansen Cosmos** transforms 37+ blockchains and institutional Smart Money flows into a **living, interactive 3D solar system**. Every celestial body, orbital velocity, atmospheric corona, and orbiting moon is mathematically calculated from live Nansen API endpoints.

* **Macro Universe**: Zoom out to see the entire multichain galaxy. Observe which ecosystems are expanding, which are accelerating in transaction velocity, and how capital migrates between planets via glowing interplanetary plasma streams.
* **Micro Planetary System ("The Population Layer")**: Click any planet (e.g., Ethereum, Base, Solana, HyperEVM, Arbitrum) to smoothly fly into high orbit. Inspect the fleet of **Smart Money Moons** orbiting the planet—each representing tokens heavily accumulated by verified Smart Traders and Funds.

---

## ⚡ How Nansen Data Drives the Core Logic (Data Integration)

Nansen data does not simply sit in text boxes—it is the **gravitational constant and physical fuel** of the entire universe:

```
                                  ┌──────────────────────────────────────────────┐
                                  │               NANSEN V1 API                  │
                                  │  • /api/v1/chains/chain-rank (37 chains)     │
                                  │  • /api/v1/smart-money/holdings              │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                         ┌───────────────────────────────┼───────────────────────────────┐
                         ▼                               ▼                               ▼
               [Planetary Scale & Mass]       [Orbital Velocity & Spin]      [Atmospheric Aura & Corona]
               R = baseR × (1 + (log₁₀(Vol)-6)/5)  V = baseV × √(Txs/10⁶)      Emerald (+15% Vol Momentum)
               Gas Giants vs Dense Worlds     Fast turnover = rapid orbit    Crimson (-15% Vol Contraction)
                         │                               │                               │
                         └───────────────────────────────┼───────────────────────────────┘
                                                         │
                                                         ▼
                                       ┌───────────────────────────────────┐
                                       │    SMART MONEY MOONS FLEET        │
                                       │  Orbiting token satellites sized  │
                                       │  by Smart Trader USD value ($)    │
                                       └───────────────────────────────────┘
```

### 1. Planetary Mass & Radius (Visual Scale)
* **API Fuel**: `total_dex_volume_usd` & `tvl_usd` from `/api/v1/chains/chain-rank`.
* **Formula**: $R = R_{\text{base}} \times \left(1 + \frac{\log_{10}(\max(10^6, \text{MetricValue})) - 6}{5}\right)$.
* High-liquidity ecosystems (Solana, Ethereum, BNB, Base) appear as majestic gas giants with planetary rings, while emerging chains appear as dense terrestrial worlds.

### 2. Orbital Velocity & Axial Spin
* **API Fuel**: `transaction_count` and `transaction_count_percent_change`.
* **Formula**: $\omega = \omega_{\text{base}} \times \sqrt{\frac{\text{Txs}}{10^6}} \times (1 + \Delta_{\text{pct}} \times 0.5)$.
* Ecosystems with surging daily activity revolve faster around the central star.

### 3. Atmospheric Aura & Flare Weather
* **API Fuel**: `total_dex_volume_usd_percent_change`.
* **Jade Aurora**: Positive capital expansion ($> +15\%$).
* **Terracotta Turbulence**: Outflow or volume contraction ($< -15\%$).
* **Celestial Slate**: Stable equilibrium.

### 4. Smart Money Moons (The Population Layer)
* **API Fuel**: `/api/v1/smart-money/holdings` filtered by chain.
* When you click a planet, camera transitions to planetary orbit. You see orbiting satellites representing the top Smart Money holdings on that chain.
* Satellite radius corresponds to USD value held by Smart Money; green/red halo corresponds to 24h balance change; hover/click reveals Smart Trader count, FDV, and sectors.

### 5. Interplanetary Capital Streams (The Nansen TVL Migration Matrix)
* **API Fuel**: `tvl_usd` & `tvl_usd_percent_change` from `/api/v1/chains/chain-rank`.
* **Formula**: Dynamically computes the benchmark weighted market TVL growth rate $\mu = \frac{\sum \text{TVL}_i \Delta_i}{\sum \text{TVL}_i}$. Chains lagging behind market expansion act as net capital donors ($\Delta \$ < 0$), routing proportional liquidity streams along quadratic Bezier curves into high-momentum absorber ecosystems ($\Delta \$ > 0$).
* **Zero Mock Data**: 100% mathematically derived from live Nansen API metrics without hardcoded corridor tables.

---

## 🎮 Interactive Features

- **Smooth 60fps 3D Camera Fly-To**: Click any planet in 3D or in the quick-jump bar to swoosh directly into orbit.
- **Dynamic Metric Scaling**: Toggle planet size scaling between **DEX Volume**, **TVL**, **Transaction Count**, and **Active Users** in real-time.
- **Cosmos Leaderboard**: Left collapsible drawer displaying live 7D DEX Volume rankings and momentum bars.
- **Planet Telemetry HUD**: Glassmorphic right panel with full Nansen chain metrics and scrollable Smart Money fleet.
- **Token God Mode Modal**: Click any orbiting moon to view token contract address (with one-click copy), smart trader count, token sectors, and direct link to Nansen Token God Mode.
- **Simulation Time Controls**: Speed up the cosmos ($0.5\times, 1\times, 2\times, 4\times$) or pause time.
- **Smart Credit Caching**: Built-in intelligent local caching layer ensuring instantaneous loading, protecting your Nansen API credits while supporting on-demand live refreshes.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16 (App Router) + TypeScript
* **3D Graphics Engine**: Three.js + React Three Fiber (`@react-three/fiber`) + `@react-three/drei`
* **Styling**: Tailwind CSS 4 + Lucide Icons + Glassmorphism Shaders
* **Data Provider**: Nansen API (`/api/v1/chains/chain-rank`, `/api/v1/smart-money/holdings`)

---

## 🚀 Quick Start (Run Locally in < 2 Minutes)

### Prerequisites
* Node.js 18+ (tested on Node 20 / 25)
* `pnpm` (or `npm`)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/nansen-cosmos.git
cd nansen-cosmos
pnpm install
```

### 2. Configure Environment
Create a `.env.local` file:
```env
NANSEN_API_KEY=your_nansen_api_key_here
```
*(A pre-cached snapshot of 37 chains and top Smart Money fleets is included out-of-the-box, so the app runs instantly even without an API key!)*

### 3. Launch Development Server
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build for Production
```bash
pnpm build
pnpm start
```

---

## 🏆 Meridian Buildathon Submission Checklist

- [x] **Data Integration (25%)**: Nansen data directly computes planetary mass, orbital velocity, atmospheric glow, and Smart Money moon fleets.
- [x] **Creativity & Originality (25%)**: Completely transcends static dashboards and chatbot wrappers with an interactive spatial 3D universe.
- [x] **Functionality & Workability (25%)**: Live, responsive, bug-free 60fps WebGL with smooth camera damping, telemetry panels, and token modals.
- [x] **Documentation & Submission (25%)**: Clean README, runnable in under 2 minutes, and fully reproducible build.

---

*Crafted for the Nansen Meridian Buildathon 2026.*
