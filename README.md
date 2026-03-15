# dollar-cost-averaging-bot

A Telegram bot for monitoring Solana wallets and detecting DCA (Dollar Cost Averaging) activity in real time. Tracks on-chain transactions, calculates market metrics, and sends formatted alerts to Telegram.

## Overview

The bot monitors a list of Solana wallet addresses, detects swap transactions, and identifies potential DCA patterns based on volume and timing. When a DCA session is detected, it sends a detailed notification with market data to the admin channel.

**Key features:**
- Real-time Solana wallet monitoring via Helius API
- DCA session detection with start/stop notifications
- PI (Price Impact) and VI (Volatility Index) metrics calculation
- Token analytics via DexScreener API
- Admin panel via Telegram: manage wallets and config on the fly
- Configurable PI threshold and polling interval
- Excel-style wallet list with inline controls

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Bot framework | grammY |
| Blockchain | Solana Web3.js + Helius API |
| Token data | DexScreener API + Jupiter token list |
| Storage | JSON (config + wallets) |

## Architecture

```
Polling loop (configurable interval)
        │
        ▼
 Helius API — fetch recent transactions per wallet
        │
        ▼
 Transaction parser
  ├── Extract pre/post token symbols
  ├── Detect swap type (BUY / SELL)
  └── Calculate volume
        │
        ▼
 Token Analytics (DexScreener)
  ├── Price, Liquidity, FDV
  ├── PI = volume / liquidity × 100
  └── VI = stdDev / avg × 100 (price history)
        │
        ▼
 PI Threshold check
  └── if PI > threshold → trigger DCA session
        │
        ▼
 DCA Session Manager (in-memory Map)
  ├── New session → sendDcaStartNotification
  ├── Ongoing → accumulate volume + tx count
  └── Timeout (3 min no activity) → sendDcaStopNotification
```

## Project Structure

```
src/
├── bot.ts                  # Entry point, bot init, monitor start
├── callbacks/              # Inline keyboard handlers
│   ├── config.actions.ts
│   └── wallet.actions.ts
├── commands/               # Bot commands (/start, /stop, /wallet, /config)
├── core/
│   ├── dca/
│   │   ├── dca.controller.ts    # Interval-based timeout checker
│   │   ├── dca.service.ts       # Session state machine
│   │   └── notifier.service.ts  # Telegram notifications
│   └── solana/
│       ├── monitor.service.ts   # Main polling loop
│       ├── solana.service.ts    # Helius RPC calls
│       ├── types.ts
│       └── utils.ts
├── keyboards/              # grammY InlineKeyboard definitions
├── services/               # Config and wallet file I/O
└── data/
    ├── config.json
    └── wallets.json
```

## Environment Variables

```env
TELEGRAM_BOT_TOKEN=
HELIUS_RPC_URL=
HELIUS_API_KEY=
ADMIN_IDS=
```

## Getting Started

```bash
npm install
cp .env.example .env
# fill in your values
npm run dev
```

## Notes

This is a personal research project exploring on-chain DCA detection on Solana. Built solo — architecture, analytics logic, and bot interface by me. Some analytics calculations are approximate and the project is in proof-of-concept stage.
```