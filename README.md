# Presight Mezo Backend

Core Presight escrow system and API server for Mezo Testnet integration.

## Features
- **Smart Contracts**: Prediction Market, Mandate Validator, Group Registry on Mezo Testnet.
- **Relay System**: Gasless transaction relay for Mezo Passport users.
- **Express API**: Full CRUD with SIWE authentication and mandate validation.
- **WebSocket**: Real-time event broadcasting.
- **SQLite DB**: Local state persistence with WAL mode.

## Setup
1. `cp .env.example .env` (fill in your private keys and contract addresses)
2. `npm install`
3. `npm run dev`

## Testing
- `npm test`: Local Hardhat tests.
- `npm run e2e`: Full lifecycle test on Mezo Testnet.
