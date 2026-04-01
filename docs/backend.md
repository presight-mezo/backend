# Presight 🌌
## Backend Developer Documentation
**Smart Contracts · API · WebSocket · Mezo Passport Integration**

* **Stack:** Node.js · Express.js · WebSocket (ws)
* **Contracts:** Solidity · Hardhat · OpenZeppelin
* **Network:** Mezo Testnet (Chain ID 31611)
* **Deploy:** Railway (API + WebSocket)
* **Currency:** mUSD (Mock ERC-20 on Mezo Testnet)
* **Version:** 1.0.0 — Hackathon MVP
* **Date:** April 2026

---

## 1. Project Overview
The Presight backend is the trust and execution layer between the frontend UI and the Mezo blockchain. It owns three responsibilities: (1) smart contract deployment and on-chain lifecycle management, (2) the REST API for group/market/profile state, and (3) the WebSocket server for real-time event broadcasting. All MUSD staking transactions go through this layer — the frontend never writes to contracts directly.

### 1.1 Architecture Overview

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| **Smart Contracts** | Solidity, Hardhat, OpenZeppelin | Escrow, staking, fee routing, auto-distribution, group registry, mandate validation — all on Mezo Testnet |
| **REST API** | Node.js, Express.js | Groups, markets, stakes, yield simulation, profile/scores, resolver triggers |
| **WebSocket Server** | ws (Node.js library) | Real-time push: stake events, YES/NO bar updates, yield ticks, resolution notifications |
| **Passport Integration** | Mezo Passport SDK | One-time mandate setup, gasless stake execution, mandate scope validation per transaction |
| **Event Listener** | ethers.js / viem | Watches on-chain events, syncs contract state to DB, triggers WS broadcasts |
| **Database** | PostgreSQL (or SQLite for hackathon MVP) | Groups, markets, stakes, users, mandate records, Conviction Score cache |

### 1.2 Critical Security Rules
* **RULE 1:** All MUSD stake transactions MUST be validated against the user's mandate before execution. Never execute a stake that exceeds the declared mandate limit.
* **RULE 2:** The 1% platform fee is hardcoded in the smart contract and cannot be bypassed. The backend must never attempt to circumvent this.
* **RULE 3:** No private keys are stored server-side. All signing occurs client-side via Mezo Passport smart accounts.
* **RULE 4:** Only the assigned Trusted Resolver may trigger resolution for a given market. Validate resolver identity on every resolution call.

---

## 2. Project Structure
```text
presight-backend/
├── contracts/                        # Solidity smart contracts
│   ├── PredictionMarket.sol          # Core: escrow, staking, resolution, fee routing
│   ├── GroupRegistry.sol             # Group creation, membership, resolver assignment
│   ├── MandateValidator.sol          # Mezo Passport mandate scope verification
│   └── mocks/MockERC20.sol           # Mock MUSD token for testing
├── scripts/                          # Utility & deployment scripts
│   ├── deploy.js                     # Core testnet deployment wrapper
│   ├── deploy-mock-musd.js           # Independent MUSD deployment (hackathon)
│   ├── diagnose-stake.js             # On-chain state diagnostics
│   ├── generate-siwe-token.ts        # Fast auth token generation for E2E
│   └── verify.ts                     # Mezo Explorer contract verification
├── deployments/                      # Deployed contract address JSON
│   ├── mezoTestnet.json          
│   └── sandbox.json              
├── test/
│   ├── PredictionMarket.test.ts      # Unit tests
│   ├── GroupRegistry.test.ts         
│   ├── MandateValidator.test.ts      
│   └── e2e/                          # End-to-end live blockchain tests
│       └── stake-and-distribute.ts   
├── src/
│   ├── index.ts                      # Express + WebSocket server entry point
│   ├── config.ts                     # Contract addresses, chain config, env
│   ├── db/
│   │   ├── schema.ts                 # Database schema & SQLite DAO models
│   │   └── client.ts                 # SQLite connection logic
│   ├── routes/
│   │   ├── groups.ts                 # Group CRUD API
│   │   ├── markets.ts                # Market CRUD API
│   │   ├── stakes.ts                 # Stake execution & Zero Risk routing
│   │   ├── mandate.ts                # Mezo Passport Mandate registration
│   │   ├── resolver.ts               # Resolution triggers & scoring logic
│   │   ├── yield.ts                  # Yield simulation endpoints
│   │   └── profile.ts                # Conviction Score analytics API
│   ├── services/
│   │   ├── passport.ts               # Relayer logic to Mezo blockchain
│   │   ├── yieldSimulator.ts         # Zero Risk background interval engine
│   │   ├── contractEvents.ts         # ethers.js on-chain event listener
│   │   └── websocket.ts              # WS broadcasting engine
│   ├── middleware/
│   │   ├── auth.ts                   # SIWE Signature & optionalAuth checking
│   │   ├── validateMandate.ts        # Server-side mandate constraint checking
│   │   └── errorHandler.ts           # Global Express error catching
│   └── types/
│       └── ...                       # Interfaces
├── docs/                             # Architecture & API documentation
├── hardhat.config.cjs                # Hardhat config (CommonJS)
├── .env.example                      # ENV template
└── railway.json                      # Deployment config
```

---

## 3. Smart Contracts
Deployment target: Mezo Testnet, Chain ID 31611.

### 3.1 PredictionMarket.sol
Core contract. Holds MUSD in escrow. Manages staking, resolution, reward distribution, and 1% fee routing.

**State Variables**
```solidity
IERC20 public immutable musd;              // MUSD ERC-20 contract
address public immutable protocolFeeAddr;  // Mezo protocol fee recipient
uint256 public constant FEE_BPS = 100;     // 1% fee in basis points

struct Market {
    bytes32  id;
    bytes32  groupId;
    string   question;
    uint256  deadline;
    address  resolver;
    Mode     mode;        // FULL_STAKE | ZERO_RISK
    Status   status;      // OPEN | RESOLVED
    Outcome  outcome;     // NONE | YES | NO
    uint256  yesPool;     // total MUSD staked YES
    uint256  noPool;      // total MUSD staked NO
}

mapping(bytes32 => Market) public markets;
mapping(bytes32 => mapping(address => Stake)) public stakes;
// Stake: { isYes, amount, claimed }
```

**Key Functions**
| Function | Access | Description |
| :--- | :--- | :--- |
| `createMarket` | Group admin | Creates a new YES/NO market. Emits MarketCreated. |
| `stake` | Any member | Transfers MUSD from user to escrow. Validates mandate. Emits StakePlaced. |
| `resolve` | Resolver only | Closes market, records outcome, triggers auto-distribution. |
| `_distribute` | Internal | Deducts 1% fee → protocol address. Distributes net pool to winners. |
| `claimReward` | Winners | Fallback if auto-distribution fails. |

**Security Checklist**
* **ReentrancyGuard:** Applied to `stake()`, `resolve()`, and `claimReward()`.
* **onlyResolver:** `resolve()` reverts if caller is not the assigned resolver.
* **Deadline Enforcement:** `stake()` reverts if market deadline has passed.
* **Auto-Distribution:** Pro-rata winner rewards are pushed automatically to reduce friction.

### 3.2 GroupRegistry.sol
Manages group creation, membership, and resolver assignment.
```solidity
struct Group {
    bytes32  id;
    address  admin;
    string   name;
}

mapping(bytes32 => Group) public groups;
mapping(bytes32 => mapping(address => bool)) public members;

// Key functions
createGroup(name)
joinGroup(groupId)
assignResolver(marketId, resolver)
```

### 3.3 MandateValidator.sol
Called by `PredictionMarket.stake()` to verify the Mezo Passport mandate scope.
```solidity
function validateMandate(
    address user,
    uint256 amount,
    bytes32 marketId
) external view returns (bool valid, string memory reason);

// Checks:
// 1. User has an active mandate
// 2. amount <= remaining mandate capacity
// 3. One stake per user per market
```

---

## 4. REST API Reference
* **Base URL:** `https://presight-api.railway.app/api/v1`
* **Authentication:** SIWE (Sign-In With Ethereum). Include `Authorization: Bearer <siwe-token>` header.

### 4.1 Groups
**`POST /groups`** Create a new prediction group
```json
{ "name": "Bitcoin Maxis" }
```

**`GET /groups/:groupId`** Get group metadata and members

**`POST /groups/:groupId/join`** Join a group

### 4.2 Markets
**`POST /markets`** Create a new YES/NO market
```json
{
  "groupId": "0xabc...",
  "question": "Will BTC close above $120K this week?",
  "deadline": "2026-04-07T23:59:59Z",
  "mode": "full-stake",
  "resolverAddress": "0xresolver..."
}
```

**`GET /markets/:marketId`** Get market detail with live pools

### 4.3 Stakes
**`POST /stakes`** Place a stake — validates mandate, executes gasless via Passport.
```json
{
  "marketId": "0xmarket...",
  "direction": "YES",
  "amount": "50000000000000000000",
  "mode": "full-stake"
}
```

---

## 5. WebSocket Server
URL: `wss://presight-api.railway.app`

### 5.1 Real-time Events
| Event | Trigger | Payload |
| :--- | :--- | :--- |
| `stake:placed` | Successful stake | `{ marketId, direction, amount, userAddress }` |
| `market:updated` | Total pool change | `{ marketId, yesPool, noPool, participantCount }` |
| `market:resolved` | Market resolution | `{ marketId, outcome, winnerCount }` |
| `yield:tick` | 30s timer (Zero Risk) | `{ marketId, userAddress, accruedAmount }` |

---

## 6. Current Deployment (Mezo Testnet)

| Contract | Address |
| :--- | :--- |
| **PredictionMarket** | `0xEee0e4b9dAe28Dd47089c8D0f00Aac93a4739292` |
| **GroupRegistry** | `0xBEf42ca5c35EDB69CB338A0fdBfF0a1F2f944aB7` |
| **MandateValidator** | `0x99e0dA1A24bD8661C5794Ee1b77b83304A97DdB5` |
| **mUSD (Mock ERC20)** | `0x507Ac33B7B1332b4488AE772fB116cb2E0EA0511` |

---

## 7. Environment Variables (.env)
```env
MEZO_RPC_URL=https://rpc.test.mezo.org
PREDICTION_MARKET_ADDRESS=0xEee0e4b9dAe28Dd47089c8D0f00Aac93a4739292
GROUP_REGISTRY_ADDRESS=0xBEf42ca5c35EDB69CB338A0fdBfF0a1F2f944aB7
MANDATE_VALIDATOR_ADDRESS=0x99e0dA1A24bD8661C5794Ee1b77b83304A97DdB5
MUSD_ADDRESS=0x507Ac33B7B1332b4488AE772fB116cb2E0EA0511
DEPLOYER_PRIVATE_KEY=...
```

---

## 8. Deployment Commands
```bash
# Compile and test
npx hardhat compile
npx hardhat test

# Deploy to Testnet
npx hardhat run scripts/deploy.js --network mezoTestnet

# Verify Contract
npx hardhat verify --network mezoTestnet <ADDR> <CONSTRUCTOR_ARGS>
```

---
*Presight Protocol — Built for Mezo Hackathon.*