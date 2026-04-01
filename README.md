# Presight Mezo Backend

Core Presight escrow system and API server for Mezo Testnet integration.

## Features
- **Smart Contracts**: Prediction Market, Mandate Validator, Group Registry on Mezo Testnet.
- **Relay System**: Gasless transaction relay via **Server-Side Relay Fallback** (Deployer wallet execution).
- **Express API**: Full CRUD with SIWE authentication and mandate validation.
- **WebSocket**: Real-time event broadcasting.
- **SQLite DB**: Local state persistence with WAL mode.

## ⚠️ Mezo Passport SDK Status
The current implementation uses a **Server-Side Relay Fallback**. A native backend SDK (`mezo-passport`) was unavailable during the Day 1 spike. All "gasless" transactions are currently signed and executed by the backend's deployer wallet on behalf of users verified via SIWE. 

## Setup
1. `cp .env.example .env` (fill in your private keys and contract addresses)
2. `npm install`
3. `npm run dev`

## Testing
- `npm test`: Local Hardhat tests.
- `npm run e2e`: Full lifecycle test on Mezo Testnet.
