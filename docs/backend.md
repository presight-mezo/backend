Here is the formatting for the backend developer document converted into Markdown:

# [cite_start]PRESIGHT [cite: 369]
## [cite_start]Backend Developer Documentation [cite: 370]
[cite_start]**Smart Contracts · API · WebSocket · Mezo Passport Integration** [cite: 371]

* [cite_start]**Stack:** Node.js · Express.js · WebSocket (ws) [cite: 372]
* [cite_start]**Contracts:** Solidity · Hardhat · OpenZeppelin [cite: 373]
* [cite_start]**Network:** Mezo Testnet (Chain ID 31611) [cite: 374]
* [cite_start]**Deploy:** Railway (API + WebSocket) [cite: 375]
* [cite_start]**Currency:** MUSD (ERC-20, Mezo native stablecoin) [cite: 376]
* [cite_start]**Version:** 1.0.0 — Hackathon MVP [cite: 377]
* [cite_start]**Date:** April 2026 [cite: 378]

---

## [cite_start]1. Project Overview [cite: 379]
[cite_start]The Presight backend is the trust and execution layer between the frontend UI and the Mezo blockchain. [cite: 380] [cite_start]It owns three responsibilities: (1) smart contract deployment and on-chain lifecycle management, (2) the REST API for group/market/profile state, and (3) the WebSocket server for real-time event broadcasting. [cite: 381] [cite_start]All MUSD staking transactions go through this layer — the frontend never writes to contracts directly. [cite: 382]

### [cite_start]1.1 Architecture Overview [cite: 383]

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| [cite_start]Smart Contracts [cite: 384] | [cite_start]Solidity, Hardhat, OpenZeppelin [cite: 384] | [cite_start]Escrow, staking, fee routing, auto-distribution, group registry, mandate validation — all on Mezo Testnet [cite: 384] |
| [cite_start]REST API [cite: 384] | [cite_start]Node.js, Express.js [cite: 384] | [cite_start]Groups, markets, stakes, yield simulation, profile/scores, resolver triggers [cite: 384] |
| [cite_start]WebSocket Server [cite: 384] [cite_start]| ws (Node.js library) [cite: 384] | [cite_start]Real-time push: stake events, YES/NO bar updates, yield ticks, resolution notifications [cite: 384] |
| [cite_start]Passport Integration [cite: 384] | [cite_start]Mezo Passport SDK [cite: 384] | [cite_start]One-time mandate setup, gasless stake execution, mandate scope validation per transaction [cite: 384] |
| [cite_start]Event Listener [cite: 384] [cite_start]| ethers.js / viem [cite: 384] | [cite_start]Watches on-chain events, syncs contract state to DB, triggers WS broadcasts [cite: 384] |
| [cite_start]Database [cite: 384] | [cite_start]PostgreSQL (or SQLite for hackathon MVP) [cite: 384] | [cite_start]Groups, markets, stakes, users, mandate records, Conviction Score cache [cite: 384] |

### [cite_start]1.2 Critical Security Rules [cite: 385]
* [cite_start]**RULE 1:** All MUSD stake transactions MUST be validated against the user's mandate before execution. [cite: 386] [cite_start]Never execute a stake that exceeds the declared mandate limit. [cite: 387]
* [cite_start]**RULE 2:** The 1% platform fee is hardcoded in the smart contract and cannot be bypassed. [cite: 388] [cite_start]The backend must never attempt to circumvent this. [cite: 389]
* [cite_start]**RULE 3:** No private keys are stored server-side. [cite: 390] [cite_start]All signing occurs client-side via Mezo Passport smart accounts. [cite: 390]
* [cite_start]**RULE 4:** Only the assigned Trusted Resolver may trigger resolution for a given market. [cite: 391] [cite_start]Validate resolver identity on every resolution call. [cite: 392]

---

## [cite_start]2. Project Structure [cite: 393]
```text
[cite_start]presight-backend/ [cite: 394]
[cite_start]├── contracts/                        # Solidity smart contracts [cite: 395]
[cite_start]│   ├── PredictionMarket.sol          # Core: escrow, staking, resolution, fee routing [cite: 396]
[cite_start]│   ├── GroupRegistry.sol             # Group creation, membership, resolver assignment [cite: 397]
[cite_start]│   └── MandateValidator.sol          # Mezo Passport mandate scope verification [cite: 398]
[cite_start]├── scripts/ [cite: 399]
[cite_start]│   ├── deploy.ts                     # Hardhat deploy script (all 3 contracts) [cite: 400]
[cite_start]│   └── verify.ts                     # Mezo Testnet contract verification [cite: 401]
[cite_start]├── test/ [cite: 402]
[cite_start]│   ├── PredictionMarket.test.ts      # Full stake, fee routing, auto-distribution tests [cite: 403]
[cite_start]│   ├── GroupRegistry.test.ts         # Group creation, membership, resolver role tests [cite: 404]
[cite_start]│   └── MandateValidator.test.ts      # Mandate scope enforcement tests [cite: 405]
[cite_start]├── src/ [cite: 406]
[cite_start]│   ├── index.ts                      # Express + WebSocket server entry point [cite: 407]
[cite_start]│   ├── config.ts                     # Contract addresses, chain config, env [cite: 408]
[cite_start]│   ├── db/ [cite: 409]
[cite_start]│   │   ├── schema.ts                 # Database schema definitions [cite: 410]
[cite_start]│   │   └── client.ts                 # DB connection (pg or better-sqlite3) [cite: 411]
[cite_start]│   ├── routes/ [cite: 412]
[cite_start]│   │   ├── groups.ts                 # POST /groups, GET /groups/:id, POST /groups/:id/join [cite: 413]
[cite_start]│   │   ├── markets.ts                # POST /markets, GET /markets/:id, GET /markets?groupId= [cite: 414]
[cite_start]│   │   ├── stakes.ts                 # POST /stakes (mandate-validated stake execution) [cite: 415]
[cite_start]│   │   ├── resolver.ts               # POST /resolver/:marketId/resolve [cite: 416]
[cite_start]│   │   ├── yield.ts                  # GET /yield/:userAddress/:marketId [cite: 417]
[cite_start]│   │   └── profile.ts                # GET /profile/:address, GET /leaderboard/:groupId [cite: 418]
[cite_start]│   ├── services/ [cite: 419]
[cite_start]│   │   ├── passport.ts               # Mezo Passport SDK: mandate setup + gasless stake [cite: 420]
[cite_start]│   │   ├── mandateValidator.ts       # Server-side mandate scope check [cite: 421]
[cite_start]│   │   ├── yieldSimulator.ts         # Zero Risk Mode yield accrual calculation [cite: 422]
[cite_start]│   │   ├── convictionScore.ts        # Score algorithm and leaderboard logic [cite: 423]
[cite_start]│   │   ├── contractEvents.ts         # On-chain event listener + DB sync [cite: 424]
[cite_start]│   │   └── websocket.ts              # WS server, room management, event broadcasting [cite: 425]
[cite_start]│   ├── middleware/ [cite: 426]
[cite_start]│   │   ├── auth.ts                   # Wallet signature verification (SIWE) [cite: 427]
[cite_start]│   │   ├── rateLimit.ts              # Per-wallet rate limiting on stake endpoint [cite: 428]
[cite_start]│   │   └── errorHandler.ts           # Global error handler + structured error responses [cite: 429]
[cite_start]│   └── types/ [cite: 430]
[cite_start]│       ├── contracts.ts              # TypeChain-generated types (or manual ABIs) [cite: 431]
[cite_start]│       └── api.ts                    # Request/response type definitions [cite: 432]
[cite_start]├── hardhat.config.ts                 # Hardhat config: Mezo Testnet network [cite: 433]
[cite_start]├── .env.example                      # All required environment variables [cite: 434]
[cite_start]└── railway.json                      # Railway deployment config [cite: 435]
```

---

## [cite_start]3. Smart Contracts [cite: 436]
[cite_start]Deployment target: Mezo Testnet, Chain ID 31611. [cite: 437] [cite_start]All 3 contracts must be deployed and verified before frontend integration begins (end of Week 1 gate). [cite: 437]

### [cite_start]3.1 PredictionMarket.sol [cite: 438]
Core contract. [cite_start]Holds MUSD in escrow. [cite: 439] [cite_start]Manages staking, resolution, reward distribution, and 1% fee routing. [cite: 439]

[cite_start]**State Variables** [cite: 440]
```solidity
IERC20 public immutable musd;              [cite_start]// MUSD ERC-20 contract [cite: 441]
address public immutable protocolFeeAddr;  [cite_start]// Mezo protocol fee recipient (hardcoded) [cite: 442]
uint256 public constant FEE_BPS = 100;     [cite_start]// 1% fee in basis points (immutable) [cite: 443]

[cite_start]struct Market { [cite: 444]
    [cite_start]bytes32  id; [cite: 445]
    [cite_start]address  groupId; [cite: 446]
    [cite_start]string   question; [cite: 447]
    [cite_start]uint256  deadline; [cite: 448]
    [cite_start]address  resolver; [cite: 449]
    Mode     mode;        // FULL_STAKE | [cite_start]ZERO_RISK [cite: 450]
    Status   status;      // OPEN | CLOSED | [cite_start]RESOLVED [cite: 451]
    Outcome  outcome;     // NONE | YES | [cite_start]NO [cite: 452]
    uint256  yesPool;     [cite_start]// total MUSD staked YES [cite: 453]
    uint256  noPool;      [cite_start]// total MUSD staked NO [cite: 454]
[cite_start]} [cite: 455]

[cite_start]mapping(bytes32 => Market) public markets; [cite: 456]
[cite_start]mapping(bytes32 => mapping(address => Stake)) public stakes; [cite: 457]
[cite_start]// Stake: { direction, amount, claimed } [cite: 458]
```

[cite_start]**Key Functions** [cite: 459]
| Function | Access | Description |
| :--- | :--- | :--- |
| [cite_start]`createMarket(groupId, question, deadline, resolver, mode)` [cite: 460] | [cite_start]Group admin [cite: 460] | Creates a new YES/NO market. [cite_start]Emits MarketCreated. [cite: 460] |
| [cite_start]`stake(marketId, direction, amount)` [cite: 460] | [cite_start]Any member (via Passport) [cite: 460] | Transfers MUSD from user to escrow. Validates mandate. [cite_start]Emits StakePlaced. [cite: 460] |
| [cite_start]`resolve(marketId, outcome)` [cite: 460] | [cite_start]Assigned resolver only [cite: 460] | Closes market, records outcome, triggers auto-distribution. [cite_start]Emits MarketResolved. [cite: 460] |
| [cite_start]`_distribute(marketId)` [cite: 460] | [cite_start]Internal (called by resolve) [cite: 460] | Deducts 1% fee → protocol address. Distributes net pool proportionally to winners. [cite_start]Emits RewardsDistributed. [cite: 460] |
| [cite_start]`claimReward(marketId)` [cite: 460] | [cite_start]Winners (fallback if auto fails) [cite: 460] | Pull-pattern fallback. [cite_start]Winners can manually claim if push distribution fails. [cite: 460] |

[cite_start]**Events** [cite: 461]
```solidity
[cite_start]event MarketCreated(bytes32 indexed marketId, address indexed groupId, string question, address resolver, Mode mode); [cite: 462, 463]
[cite_start]event StakePlaced(bytes32 indexed marketId, address indexed staker, bool direction, uint256 amount); [cite: 464, 465]
[cite_start]event MarketResolved(bytes32 indexed marketId, bool outcome, uint256 totalPool, uint256 feeAmount); [cite: 466, 467]
[cite_start]event RewardsDistributed(bytes32 indexed marketId, uint256 winnerCount, uint256 netPool); [cite: 468, 469]
```

[cite_start]**Security Checklist** [cite: 470]
* **ReentrancyGuard:** Applied to `stake()`, `resolve()`, and `claimReward()`. [cite_start]Import from OpenZeppelin. [cite: 471]
* [cite_start]**Modifier onlyResolver:** `resolve()` reverts if `msg.sender != markets[marketId].resolver` [cite: 472]
* [cite_start]**Deadline enforcement:** `stake()` reverts if `block.timestamp >= market.deadline` [cite: 473]
* **Status guards:** `stake()` requires OPEN; [cite_start]`resolve()` requires CLOSED (post-deadline) or OPEN with resolver override [cite: 474]
* [cite_start]**Fee immutability:** `FEE_BPS = 100` is a constant — cannot be changed by any caller [cite: 475]
* [cite_start]**Zero-distribution guard:** If winning pool is 0 (all stakes on one side), refund all stakes minus fee [cite: 476]

### [cite_start]3.2 GroupRegistry.sol [cite: 477]
[cite_start]Manages group creation, membership, and resolver assignment. [cite: 478] [cite_start]Lightweight — most state lives off-chain in the API DB. [cite: 478]
```solidity
[cite_start]struct Group { [cite: 479]
    [cite_start]bytes32  id; [cite: 480]
    [cite_start]address  admin; [cite: 481]
    [cite_start]string   name; [cite: 482]
    [cite_start]bool     exists; [cite: 483]
[cite_start]} [cite: 484]

[cite_start]mapping(bytes32 => Group)              public groups; [cite: 485]
[cite_start]mapping(bytes32 => mapping(address => bool)) public members; [cite: 486]
mapping(bytes32 => address)            public resolvers; [cite_start]// per-market resolver [cite: 487]

[cite_start]// Key functions [cite: 488]
[cite_start]createGroup(name) → bytes32 groupId [cite: 489]
[cite_start]joinGroup(groupId)                        // emits MemberJoined [cite: 490]
[cite_start]assignResolver(marketId, resolverAddress) // admin only, emits ResolverAssigned [cite: 491]
[cite_start]isGroupMember(groupId, address) → bool [cite: 492]
```

### [cite_start]3.3 MandateValidator.sol [cite: 493]
[cite_start]Called by `PredictionMarket.stake()` to verify the Mezo Passport mandate has not been exceeded. [cite: 494]
```solidity
[cite_start]interface IMandateValidator { [cite: 495]
    [cite_start]function validateMandate( [cite: 496]
        [cite_start]address user, [cite: 497]
        [cite_start]uint256 amount, [cite: 498]
        [cite_start]bytes32 marketId [cite: 499]
    [cite_start]) external view returns (bool valid, string memory reason); [cite: 500]
[cite_start]} [cite: 501]

[cite_start]// Checks: [cite: 502]
[cite_start]// 1. User has an active Passport mandate registered [cite: 503]
[cite_start]// 2. amount <= mandate.limitPerMarket [cite: 504]
[cite_start]// 3. User has not already staked on this market (one stake per market per user) [cite: 505]
```

### [cite_start]3.4 Hardhat Configuration [cite: 506]
```typescript
[cite_start]// hardhat.config.ts [cite: 507]
[cite_start]const config: HardhatUserConfig = { [cite: 508]
  [cite_start]solidity: { [cite: 509]
    [cite_start]version: "0.8.24", [cite: 510]
    [cite_start]settings: { optimizer: { enabled: true, runs: 200 } }, [cite: 511]
  [cite_start]}, [cite: 512]
  [cite_start]networks: { [cite: 513]
    [cite_start]mezoTestnet: { [cite: 514]
      [cite_start]url: process.env.MEZO_RPC_URL,  // https://rpc.mezo.testnet [cite: 515]
      [cite_start]accounts: [process.env.DEPLOYER_PRIVATE_KEY], [cite: 516]
      [cite_start]chainId: 31611, [cite: 517]
    [cite_start]}, [cite: 518]
  [cite_start]}, [cite: 519]
  [cite_start]etherscan: { [cite: 520]
    [cite_start]apiKey: { mezoTestnet: process.env.MEZO_EXPLORER_API_KEY }, [cite: 521]
    [cite_start]customChains: [{ [cite: 522]
      [cite_start]network: "mezoTestnet", [cite: 523]
      [cite_start]chainId: 31611, [cite: 524]
      [cite_start]urls: { [cite: 525]
        [cite_start]apiURL: "https://explorer.mezo.testnet/api", [cite: 526]
        [cite_start]browserURL: "https://explorer.mezo.testnet", [cite: 527]
      [cite_start]}, [cite: 528]
    [cite_start]}], [cite: 529]
  [cite_start]}, [cite: 530]
[cite_start]}; [cite: 531]
```

### [cite_start]3.5 Deploy & Verify [cite: 532]
```bash
# [cite_start]Deploy all 3 contracts to Mezo Testnet [cite: 533]
[cite_start]npx hardhat run scripts/deploy.ts --network mezoTestnet [cite: 534]

# [cite_start]Verify on Mezo Testnet explorer [cite: 535]
[cite_start]npx hardhat verify --network mezoTestnet <PREDICTION_MARKET_ADDR> <MUSD_ADDR> <FEE_ADDR> [cite: 536]
[cite_start]npx hardhat verify --network mezoTestnet <GROUP_REGISTRY_ADDR> [cite: 537]
[cite_start]npx hardhat verify --network mezoTestnet <MANDATE_VALIDATOR_ADDR> [cite: 538]

# [cite_start]After deploy: copy addresses to .env and share with frontend team [cite: 539]
[cite_start]PREDICTION_MARKET_ADDRESS=0x... [cite: 540]
[cite_start]GROUP_REGISTRY_ADDRESS=0x... [cite: 541]
[cite_start]MANDATE_VALIDATOR_ADDRESS=0x... [cite: 542]
```

---

## [cite_start]4. REST API Reference [cite: 543]
* [cite_start]**Base URL:** `https://presight-api.railway.app/api/v1` · All endpoints return JSON. [cite: 544]
* [cite_start]**Authentication:** Wallet-signed requests (SIWE — Sign-In With Ethereum). [cite: 545] [cite_start]Include `Authorization: Bearer <siwe-token>` header on all authenticated endpoints. [cite: 545]
* [cite_start]Group creation, staking, and resolution require auth. [cite: 546] [cite_start]Public reads (market detail, leaderboard) do not. [cite: 546]

### [cite_start]4.1 Groups [cite: 547]
[cite_start]**`POST /groups`** Create a new prediction group [cite: 548]
```json
[cite_start]// POST /groups — Request [cite: 549]
[cite_start]{ "name": "Bitcoin Maxis" } [cite: 550]

[cite_start]// Response 201 [cite: 551]
[cite_start]{ [cite: 552]
  [cite_start]"groupId": "0xabc...", [cite: 553]
  [cite_start]"inviteLink": "https://presight.vercel.app/group/0xabc", [cite: 554]
  [cite_start]"name": "Bitcoin Maxis", [cite: 555]
  [cite_start]"adminAddress": "0xuser...", [cite: 556]
  [cite_start]"createdAt": "2026-04-01T10:00:00Z" [cite: 557]
[cite_start]} [cite: 558]
```

[cite_start]**`GET /groups/:groupId`** Get group metadata and members [cite: 559]
```json
[cite_start]// Response 200 [cite: 560]
[cite_start]{ [cite: 561]
  [cite_start]"groupId": "0xabc...", [cite: 562]
  [cite_start]"name": "Bitcoin Maxis", [cite: 563]
  [cite_start]"adminAddress": "0xuser...", [cite: 564]
  [cite_start]"memberCount": 12, [cite: 565]
  [cite_start]"members": [{ "address": "0x...", "convictionScore": 847, "joinedAt": "..." }], [cite: 566]
  [cite_start]"activeMarketCount": 3 [cite: 567]
[cite_start]} [cite: 568]
```

[cite_start]**`POST /groups/:groupId/join`** Join a group (authenticated user) [cite: 569]
```json
[cite_start]// Response 200 [cite: 570]
[cite_start]{ "success": true, "memberCount": 13 } [cite: 571]
```

### [cite_start]4.2 Markets [cite: 572]
[cite_start]**`POST /markets`** Create a new YES/NO market [cite: 573]
```json
[cite_start]// POST /markets — Request [cite: 574]
[cite_start]{ [cite: 575]
  [cite_start]"groupId": "0xabc...", [cite: 576]
  [cite_start]"question": "Will BTC close above $120K this week?", [cite: 577]
  [cite_start]"deadline": "2026-04-07T23:59:59Z", [cite: 578]
  "mode": "full-stake",       // "full-stake" | [cite_start]"zero-risk" [cite: 579]
  [cite_start]"resolverAddress": "0xresolver..." [cite: 580]
[cite_start]} [cite: 581]

[cite_start]// Response 201 [cite: 582]
[cite_start]{ [cite: 583]
  [cite_start]"marketId": "0xmarket...", [cite: 584]
  [cite_start]"txHash": "0x...",           // GroupRegistry.createMarket() tx [cite: 585]
  [cite_start]"question": "...", [cite: 586]
  [cite_start]"deadline": "...", [cite: 587]
  [cite_start]"mode": "full-stake", [cite: 588]
  [cite_start]"resolverAddress": "0x...", [cite: 589]
  [cite_start]"status": "OPEN" [cite: 590]
[cite_start]} [cite: 591]
```

[cite_start]**`GET /markets/:marketId`** Get market detail with live stake totals [cite: 592]
```json
[cite_start]// Response 200 [cite: 593]
[cite_start]{ [cite: 594]
  [cite_start]"marketId": "0x...", [cite: 595]
  [cite_start]"question": "...", [cite: 596]
  [cite_start]"yesPool": "1050000000000000000000",  // in MUSD wei (bigint as string) [cite: 597]
  [cite_start]"noPool":  "430000000000000000000", [cite: 598]
  [cite_start]"participantCount": 8, [cite: 599]
  [cite_start]"mode": "full-stake", [cite: 600]
  [cite_start]"status": "OPEN", [cite: 601]
  [cite_start]"deadline": "2026-04-07T23:59:59Z", [cite: 602]
  [cite_start]"resolverAddress": "0x...", [cite: 603]
  [cite_start]"timeRemaining": 518340        // seconds [cite: 604]
[cite_start]} [cite: 605]
```

[cite_start]**`GET /markets?groupId=:groupId`** List all markets for a group (sorted: open first, then by deadline) [cite: 606]

### [cite_start]4.3 Stakes [cite: 607]
[cite_start]**`POST /stakes`** Place a stake — validates mandate, executes via Passport [cite: 608]
Critical path. [cite_start]This endpoint MUST perform mandate validation before calling Passport. [cite: 609] [cite_start]A stake that exceeds the mandate limit must be rejected with HTTP 422. [cite: 610]

```json
[cite_start]// POST /stakes — Request [cite: 611]
[cite_start]{ [cite: 612]
  [cite_start]"marketId": "0xmarket...", [cite: 613]
  "direction": "YES",          // "YES" | [cite_start]"NO" [cite: 614]
  [cite_start]"amount": "50000000000000000000",  // 50 MUSD in wei (string) [cite: 615]
  "mode": "full-stake"         // "full-stake" | [cite_start]"zero-risk" [cite: 616]
[cite_start]} [cite: 617]

[cite_start]// Server-side processing (MUST happen in this order): [cite: 618]
[cite_start]// 1. Verify user auth (SIWE token) [cite: 619]
[cite_start]// 2. Validate mandate: amount <= mandate.limitPerMarket [cite: 620]
[cite_start]// 3. Verify market is OPEN and deadline not passed [cite: 621]
[cite_start]// 4. Verify user has not already staked on this market [cite: 622]
[cite_start]// 5. Execute via Mezo Passport SDK (gasless) [cite: 623]
[cite_start]// 6. Wait for tx confirmation [cite: 624]
[cite_start]// 7. Update DB (stake record, market pool totals) [cite: 625]
[cite_start]// 8. Broadcast via WebSocket (stake:placed, market:updated) [cite: 626]

[cite_start]// Response 201 [cite: 627]
[cite_start]{ [cite: 628]
  [cite_start]"stakeId": "uuid", [cite: 629]
  [cite_start]"txHash": "0x...", [cite: 630]
  [cite_start]"direction": "YES", [cite: 631]
  [cite_start]"amount": "50000000000000000000", [cite: 632]
  [cite_start]"executedAt": "2026-04-01T10:05:00Z" [cite: 633]
[cite_start]} [cite: 634]

[cite_start]// Error responses: [cite: 635]
[cite_start]// 422 — mandate exceeded: { "error": "MANDATE_EXCEEDED", "limit": "50 MUSD", "attempted": "60 MUSD" } [cite: 636]
[cite_start]// 409 — already staked:   { "error": "ALREADY_STAKED" } [cite: 637]
[cite_start]// 400 — market closed:    { "error": "MARKET_CLOSED" } [cite: 638]
```

### [cite_start]4.4 Resolver [cite: 639]
[cite_start]**`POST /resolver/:marketId/resolve`** Trusted Resolver triggers market resolution [cite: 640]
```json
[cite_start]// POST /resolver/:marketId/resolve — Request [cite: 641]
{ "outcome": "YES" }   // "YES" | [cite_start]"NO" [cite: 642]

[cite_start]// Server-side processing: [cite: 643]
[cite_start]// 1. Verify caller is the assigned resolver for this market (on-chain check) [cite: 644]
[cite_start]// 2. Call PredictionMarket.resolve(marketId, outcome) via Passport/deployer key [cite: 645]
[cite_start]// 3. Wait for RewardsDistributed event (confirms auto-distribution complete) [cite: 646]
[cite_start]// 4. Update DB: market status = RESOLVED, outcome, winner list [cite: 647]
[cite_start]// 5. Broadcast: market:resolved WebSocket event to all group members [cite: 648]

[cite_start]// Response 200 [cite: 649]
[cite_start]{ [cite: 650]
  [cite_start]"txHash": "0x...", [cite: 651]
  [cite_start]"outcome": "YES", [cite: 652]
  [cite_start]"totalPool": "1480000000000000000000", [cite: 653]
  [cite_start]"feeDeducted": "14800000000000000000",   // 1% of total [cite: 654]
  [cite_start]"netPool":     "1465200000000000000000", [cite: 655]
  [cite_start]"winnerCount": 5, [cite: 656]
  [cite_start]"resolvedAt": "2026-04-07T23:59:59Z" [cite: 657]
[cite_start]} [cite: 658]
```

### [cite_start]4.5 Yield (Zero Risk Mode) [cite: 659]
[cite_start]**`GET /yield/:userAddress/:marketId`** Get simulated yield accrued by user for a market [cite: 660]
```json
[cite_start]// Response 200 [cite: 661]
[cite_start]{ [cite: 662]
  [cite_start]"userAddress": "0x...", [cite: 663]
  [cite_start]"marketId": "0x...", [cite: 664]
  [cite_start]"accruedAmount": "420000000000000000",   // 0.42 MUSD in wei (string) [cite: 665]
  [cite_start]"ratePerSecond": "13717421124828",        // MUSD wei per second [cite: 666]
  [cite_start]"elapsedSeconds": 30621, [cite: 667]
  [cite_start]"calculatedAt": "2026-04-01T10:10:00Z" [cite: 668]
[cite_start]} [cite: 669]

[cite_start]// 404 — no trove position: { "error": "NO_TROVE_POSITION" } [cite: 670]
```

### [cite_start]4.6 Profile & Leaderboard [cite: 671]
[cite_start]**`GET /profile/:address`** Get user prediction stats and history [cite: 672]
```json
[cite_start]// Response 200 [cite: 673]
[cite_start]{ [cite: 674]
  [cite_start]"address": "0x...", [cite: 675]
  [cite_start]"marketsPlayed": 14, [cite: 676]
  [cite_start]"winRate": 0.71,                // 0–1 [cite: 677]
  [cite_start]"totalStaked": "840000...",     // MUSD wei string [cite: 678]
  [cite_start]"totalWon":    "310000...", [cite: 679]
  [cite_start]"convictionScore": 847, [cite: 680]
  [cite_start]"recentMarkets": [ [cite: 681]
    [cite_start]{ "marketId": "0x...", "question": "...", "direction": "YES", "amount": "50000...", "outcome": "WIN", "reward": "23000..." } [cite: 682, 683]
  [cite_start]] [cite: 684]
[cite_start]} [cite: 685]
```

[cite_start]**`GET /leaderboard/:groupId`** Group leaderboard sorted by Conviction Score [cite: 686]
```json
[cite_start]// Response 200 [cite: 687]
[cite_start]{ [cite: 688]
  [cite_start]"groupId": "0x...", [cite: 689]
  [cite_start]"entries": [ [cite: 690]
    [cite_start]{ "rank": 1, "address": "0x...", "convictionScore": 1240, "winRate": 0.83, "marketsPlayed": 18 }, [cite: 691]
    [cite_start]{ "rank": 2, "address": "0x...", "convictionScore": 847,  "winRate": 0.71, "marketsPlayed": 14 } [cite: 692]
  [cite_start]], [cite: 693]
  [cite_start]"updatedAt": "2026-04-01T10:00:00Z" [cite: 694]
[cite_start]} [cite: 695]
```

---

## [cite_start]5. WebSocket Server [cite: 696]
[cite_start]WebSocket server runs on the same Railway service as the Express API (`wss://presight-api.railway.app`). [cite: 697] [cite_start]Uses the `ws` library. [cite: 698]

### [cite_start]5.1 Connection & Rooms [cite: 699]
```typescript
[cite_start]// Client connects with group context [cite: 700]
[cite_start]const socket = new WebSocket( [cite: 701]
  [cite_start]`wss://presight-api.railway.app?groupId=${groupId}&token=${siweToken}` [cite: 702]
[cite_start]); [cite: 703]

[cite_start]// Server-side room management [cite: 704]
[cite_start]// Each group has a "room" — all group members subscribe to the same events [cite: 705]
[cite_start]// Rooms are identified by groupId [cite: 706]
[cite_start]// On connect: server validates SIWE token, adds socket to group room [cite: 707]
[cite_start]// On disconnect: server removes socket from room [cite: 708]
```

### [cite_start]5.2 Event Types (Server → Client) [cite: 709]
| Event | Trigger | Payload | Consumer |
| :--- | :--- | :--- | :--- |
| [cite_start]`stake:placed` [cite: 710] | [cite_start]POST /stakes succeeds [cite: 710] | [cite_start]`{ marketId, direction, amount, userAddress, timestamp }` [cite: 710] | [cite_start]StakeBar, LiveFeed [cite: 710] |
| [cite_start]`market:updated` [cite: 710] | [cite_start]Any stake on a market [cite: 710] | [cite_start]`{ marketId, yesPool, noPool, participantCount }` [cite: 710] | [cite_start]MarketCard, StakeBar [cite: 710] |
| [cite_start]`market:resolved` [cite: 710] | [cite_start]Resolver calls /resolve [cite: 710] | [cite_start]`{ marketId, outcome, totalPool, feeDeducted, winnerCount }` [cite: 710] | [cite_start]MarketCard → toast [cite: 710] |
| [cite_start]`yield:tick` [cite: 710] | [cite_start]Yield service timer (30s) [cite: 710] | [cite_start]`{ marketId, userAddress, accruedAmount }` [cite: 710] | [cite_start]YieldCounter [cite: 710] |
| [cite_start]`resolver:assigned` [cite: 710] | [cite_start]Market creation with resolver [cite: 710] | [cite_start]`{ marketId, resolverAddress }` [cite: 710] | [cite_start]ResolverBadge [cite: 710] |
| [cite_start]`group:member:joined` [cite: 710] | [cite_start]POST /groups/:id/join [cite: 710] | [cite_start]`{ groupId, address, memberCount }` [cite: 710] | [cite_start]MemberList [cite: 710] |

### [cite_start]5.3 WebSocket Service Implementation [cite: 711]
```typescript
[cite_start]// src/services/websocket.ts [cite: 712]
[cite_start]import { WebSocketServer, WebSocket } from "ws"; [cite: 713]

const rooms = new Map<string, Set<WebSocket>>(); [cite_start]// groupId → sockets [cite: 714]

[cite_start]export function broadcast(groupId: string, event: string, payload: object) { [cite: 715]
  [cite_start]const room = rooms.get(groupId); [cite: 716]
  [cite_start]if (!room) return; [cite: 717]
  [cite_start]const message = JSON.stringify({ event, payload, timestamp: Date.now() }); [cite: 718]
  [cite_start]for (const client of room) { [cite: 719]
    [cite_start]if (client.readyState === WebSocket.OPEN) { [cite: 720]
      [cite_start]client.send(message); [cite: 721]
    [cite_start]} [cite: 722]
  [cite_start]} [cite: 723]
[cite_start]} [cite: 724]

[cite_start]// Call broadcast() from route handlers after DB write: [cite: 725]
[cite_start]// broadcast(groupId, "stake:placed", { marketId, direction, amount, userAddress }); [cite: 726]
[cite_start]// broadcast(groupId, "market:updated", { marketId, yesPool, noPool }); [cite: 727]
```

### [cite_start]5.4 Yield Tick Service [cite: 728]
[cite_start]The yield tick service runs a 30-second interval timer and pushes updated accrued yield amounts to all connected users in Zero Risk Mode markets. [cite: 729]
```typescript
[cite_start]// src/services/yieldSimulator.ts [cite: 730]
[cite_start]setInterval(async () => { [cite: 731]
  [cite_start]const openZeroRiskMarkets = await db.markets.getOpenZeroRisk(); [cite: 732]
  [cite_start]for (const market of openZeroRiskMarkets) { [cite: 733]
    [cite_start]const stakes = await db.stakes.getByMarket(market.id); [cite: 734]
    [cite_start]for (const stake of stakes) { [cite: 735]
      [cite_start]if (stake.mode === "zero-risk") { [cite: 736]
        [cite_start]const accrued = calculateYield(stake.userAddress, market.openedAt); [cite: 737]
        [cite_start]broadcast(market.groupId, "yield:tick", { [cite: 738]
          [cite_start]marketId: market.id, [cite: 739]
          [cite_start]userAddress: stake.userAddress, [cite: 740]
          [cite_start]accruedAmount: accrued.toString(), [cite: 741]
        [cite_start]}); [cite: 742]
      [cite_start]} [cite: 743]
    [cite_start]} [cite: 744]
  [cite_start]} [cite: 745]
[cite_start]}, 30_000); [cite: 746]
```

---

## [cite_start]6. Mezo Passport Integration [cite: 747]
Week 1 Priority. Spike Passport SDK on Days 1–2. [cite_start]Time-box to 2 days. [cite: 748] [cite_start]If mandate API is blocked, fall back to standard ethers.js signing — this is a UX enhancement, not a functional blocker. [cite: 749]

### [cite_start]6.1 Mandate Setup Flow [cite: 750]
* [cite_start]Users register a one-time Prediction Mandate via the frontend. [cite: 751] [cite_start]The backend validates and records it. [cite: 751]
* [cite_start]Frontend calls Mezo Passport SDK to register mandate on-chain [cite: 752]
* [cite_start]Frontend sends POST `/mandate` with mandate details and tx hash [cite: 753]
* [cite_start]Backend verifies tx on-chain (mandate is live) [cite: 754]
* [cite_start]Backend stores mandate record: `{ userAddress, limitPerMarket, txHash, registeredAt }` [cite: 755]
* [cite_start]All subsequent stakes validate against this record before execution [cite: 756]

### [cite_start]6.2 Gasless Stake Execution [cite: 757]
```typescript
[cite_start]// src/services/passport.ts [cite: 758]
[cite_start]import { MezoPassport } from "mezo-passport-sdk"; [cite: 759]

[cite_start]const passport = new MezoPassport({ [cite: 760]
  [cite_start]rpcUrl: process.env.MEZO_RPC_URL, [cite: 761]
  [cite_start]chainId: 31611, [cite: 762]
[cite_start]}); [cite: 763]

[cite_start]export async function executeGaslessStake(params: { [cite: 764]
  [cite_start]userAddress: string; [cite: 765]
  [cite_start]marketId: string; [cite: 766]
  direction: "YES" | [cite_start]"NO"; [cite: 767]
  [cite_start]amount: bigint; [cite: 768]
[cite_start]}): Promise<{ txHash: string }> { [cite: 769]

  [cite_start]// 1. Validate mandate BEFORE calling Passport [cite: 770]
  [cite_start]const mandate = await db.mandates.get(params.userAddress); [cite: 771]
  [cite_start]if (!mandate) throw new Error("NO_MANDATE"); [cite: 772]
  [cite_start]if (params.amount > mandate.limitPerMarket) throw new Error("MANDATE_EXCEEDED"); [cite: 773]

  [cite_start]// 2. Execute via Passport (gasless — no popup for user) [cite: 774]
  [cite_start]const tx = await passport.executeTransaction({ [cite: 775]
    [cite_start]userAddress: params.userAddress, [cite: 776]
    [cite_start]contractAddress: CONTRACTS.PredictionMarket, [cite: 777]
    [cite_start]functionName: "stake", [cite: 778]
    [cite_start]args: [params.marketId, params.direction === "YES", params.amount], [cite: 779]
  [cite_start]}); [cite: 780]

  [cite_start]// 3. Wait for confirmation [cite: 781]
  [cite_start]const receipt = await tx.wait(); [cite: 782]
  [cite_start]return { txHash: receipt.hash }; [cite: 783]
[cite_start]} [cite: 784]
```

### [cite_start]6.3 Fallback: Standard Signing [cite: 785]
[cite_start]If Mezo Passport SDK is unavailable or blocked during hackathon, fall back to standard ethers.js with a server-side deployer key for demo purposes only: [cite: 786]
```typescript
[cite_start]// FALLBACK ONLY — not for production [cite: 787]
[cite_start]const provider = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL); [cite: 788]
[cite_start]const signer   = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider); [cite: 789]
[cite_start]const contract = PredictionMarket__factory.connect(CONTRACT_ADDR, signer); [cite: 790]
[cite_start]const tx = await contract.stake(marketId, direction === "YES", amount); [cite: 791]
[cite_start]await tx.wait(); [cite: 792]
```
[cite_start]Fallback security note: The deployer key must only be used for stake execution, never for anything else. [cite: 793] [cite_start]Rotate immediately after hackathon. [cite: 794]

### [cite_start]6.4 Mandate Validation Service [cite: 795]
```typescript
[cite_start]// src/services/mandateValidator.ts [cite: 796]
[cite_start]export async function validateMandate(userAddress: string, amount: bigint): Promise<void> { [cite: 797]
  [cite_start]const mandate = await db.mandates.get(userAddress); [cite: 798]

  [cite_start]if (!mandate) { [cite: 799]
    [cite_start]throw { code: "NO_MANDATE", message: "User has not set a Prediction Mandate" }; [cite: 800]
  [cite_start]} [cite: 801]
  [cite_start]if (amount > mandate.limitPerMarket) { [cite: 802]
    [cite_start]throw { [cite: 803]
      [cite_start]code: "MANDATE_EXCEEDED", [cite: 804]
      [cite_start]message: `Amount ${formatMUSD(amount)} exceeds mandate limit ${formatMUSD(mandate.limitPerMarket)}`, [cite: 805]
      [cite_start]limit: mandate.limitPerMarket.toString(), [cite: 806]
      [cite_start]attempted: amount.toString(), [cite: 807]
    [cite_start]}; [cite: 808]
  [cite_start]} [cite: 809]
[cite_start]} [cite: 810]
```

---

## [cite_start]7. Database Schema [cite: 811]
[cite_start]Hackathon MVP: SQLite (`better-sqlite3`) is sufficient for local and Railway development. [cite: 812] The schema below is compatible with both SQLite and PostgreSQL. [cite_start]Swap the client in `db/client.ts` for production. [cite: 813]

### [cite_start]7.1 Tables [cite: 814]
```sql
[cite_start]-- Groups [cite: 815]
[cite_start]CREATE TABLE groups ( [cite: 816]
    [cite_start]id            TEXT PRIMARY KEY,   -- bytes32 on-chain groupId [cite: 817]
    [cite_start]name          TEXT NOT NULL, [cite: 818]
    [cite_start]admin_address TEXT NOT NULL, [cite: 819]
    [cite_start]created_at    TIMESTAMP DEFAULT NOW() [cite: 820]
[cite_start]); [cite: 821]

[cite_start]-- Group Members [cite: 822]
[cite_start]CREATE TABLE group_members ( [cite: 823]
    [cite_start]group_id   TEXT REFERENCES groups(id), [cite: 824]
    [cite_start]address    TEXT NOT NULL, [cite: 825]
    [cite_start]joined_at  TIMESTAMP DEFAULT NOW(), [cite: 826]
    [cite_start]PRIMARY KEY (group_id, address) [cite: 827]
[cite_start]); [cite: 828]

[cite_start]-- Markets [cite: 829]
[cite_start]CREATE TABLE markets ( [cite: 830]
    [cite_start]id               TEXT PRIMARY KEY,   -- bytes32 on-chain marketId [cite: 831]
    [cite_start]group_id         TEXT REFERENCES groups(id), [cite: 832]
    [cite_start]question         TEXT NOT NULL, [cite: 833]
    [cite_start]deadline         TIMESTAMP NOT NULL, [cite: 834]
    [cite_start]resolver_address TEXT NOT NULL, [cite: 835]
    mode             TEXT NOT NULL,      -- "full-stake" | [cite_start]"zero-risk" [cite: 836, 837]
    status           TEXT DEFAULT "OPEN", -- "OPEN" | [cite_start]"RESOLVED" [cite: 838]
    outcome          TEXT,               -- "YES" | "NO" | [cite_start]NULL [cite: 839, 840]
    [cite_start]yes_pool         NUMERIC DEFAULT 0,  -- MUSD wei (bigint-safe string) [cite: 841]
    [cite_start]no_pool          NUMERIC DEFAULT 0, [cite: 842]
    [cite_start]created_at       TIMESTAMP DEFAULT NOW() [cite: 843]
[cite_start]); [cite: 844]

[cite_start]-- Stakes [cite: 845]
[cite_start]CREATE TABLE stakes ( [cite: 846]
    [cite_start]id           UUID PRIMARY KEY DEFAULT gen_random_uuid(), [cite: 847]
    [cite_start]market_id    TEXT REFERENCES markets(id), [cite: 848]
    [cite_start]user_address TEXT NOT NULL, [cite: 849]
    direction    TEXT NOT NULL,   -- "YES" | [cite_start]"NO" [cite: 850]
    [cite_start]amount       NUMERIC NOT NULL, -- MUSD wei [cite: 851]
    [cite_start]mode         TEXT NOT NULL, [cite: 852]
    [cite_start]tx_hash      TEXT NOT NULL, [cite: 853]
    [cite_start]staked_at    TIMESTAMP DEFAULT NOW(), [cite: 854]
    [cite_start]UNIQUE (market_id, user_address)  -- one stake per user per market [cite: 855]
[cite_start]); [cite: 856]

[cite_start]-- Mandates [cite: 857]
[cite_start]CREATE TABLE mandates ( [cite: 858]
    [cite_start]user_address      TEXT PRIMARY KEY, [cite: 859]
    [cite_start]limit_per_market  NUMERIC NOT NULL,  -- MUSD wei [cite: 860]
    [cite_start]tx_hash           TEXT NOT NULL, [cite: 861]
    [cite_start]registered_at     TIMESTAMP DEFAULT NOW() [cite: 862]
[cite_start]); [cite: 863]

[cite_start]-- Trove Positions (Zero Risk Mode) [cite: 864]
[cite_start]CREATE TABLE trove_positions ( [cite: 865]
    [cite_start]user_address   TEXT PRIMARY KEY, [cite: 866]
    [cite_start]trove_balance  NUMERIC NOT NULL,  -- BTC collateral (for yield calc) [cite: 867]
    [cite_start]musd_balance   NUMERIC NOT NULL, [cite: 868]
    [cite_start]updated_at     TIMESTAMP DEFAULT NOW() [cite: 869]
[cite_start]); [cite: 870]
```

### [cite_start]7.2 Conviction Score Table [cite: 871]
```sql
[cite_start]-- Conviction Scores (recalculated after each market resolution) [cite: 872]
[cite_start]CREATE TABLE conviction_scores ( [cite: 873]
    [cite_start]user_address      TEXT NOT NULL, [cite: 874]
    [cite_start]group_id          TEXT REFERENCES groups(id), [cite: 875]
    [cite_start]score             INTEGER DEFAULT 0, [cite: 876]
    [cite_start]markets_played    INTEGER DEFAULT 0, [cite: 877]
    [cite_start]wins              INTEGER DEFAULT 0, [cite: 878]
    [cite_start]total_staked      NUMERIC DEFAULT 0, [cite: 879]
    [cite_start]total_won         NUMERIC DEFAULT 0, [cite: 880]
    [cite_start]last_updated      TIMESTAMP DEFAULT NOW(), [cite: 881]
    [cite_start]PRIMARY KEY (user_address, group_id) [cite: 882]
[cite_start]); [cite: 883]

[cite_start]-- Score algorithm (recalculate on each resolution): [cite: 884]
[cite_start]-- score += stake_amount_normalized * (win ? 10 : 0) [cite: 885]
[cite_start]-- where stake_amount_normalized = stake / market_total_pool * 100 [cite: 886]
[cite_start]-- High-stake correct calls contribute more than low-stake ones [cite: 887]
```

---

## [cite_start]8. Services Reference [cite: 888]
### [cite_start]8.1 Contract Event Listener (`contractEvents.ts`) [cite: 889]
[cite_start]Watches on-chain events and syncs state to the database. [cite: 890] [cite_start]Runs as a background process alongside the Express server. [cite: 890]
```typescript
[cite_start]// src/services/contractEvents.ts [cite: 891]
[cite_start]const provider = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL); [cite: 892]
[cite_start]const contract = PredictionMarket__factory.connect(PREDICTION_MARKET_ADDR, provider); [cite: 893]

[cite_start]// Listen for StakePlaced — sync pool totals to DB [cite: 894]
[cite_start]contract.on("StakePlaced", async (marketId, staker, direction, amount) => { [cite: 895]
  [cite_start]await db.markets.updatePool(marketId, direction, amount); [cite: 896]
  [cite_start]const market = await db.markets.get(marketId); [cite: 897]
  [cite_start]broadcast(market.groupId, "market:updated", { [cite: 898]
    [cite_start]marketId, yesPool: market.yesPool, noPool: market.noPool, [cite: 899]
    [cite_start]participantCount: market.participantCount, [cite: 900]
  [cite_start]}); [cite: 901]
[cite_start]}); [cite: 902]

[cite_start]// Listen for MarketResolved — update DB, broadcast, recalculate scores [cite: 903]
[cite_start]contract.on("RewardsDistributed", async (marketId, winnerCount, netPool) => { [cite: 904]
  [cite_start]const market = await db.markets.setResolved(marketId); [cite: 905]
  [cite_start]await convictionScoreService.recalculate(market.groupId); [cite: 906]
  [cite_start]broadcast(market.groupId, "market:resolved", { [cite: 907]
    [cite_start]marketId, outcome: market.outcome, [cite: 908]
    [cite_start]totalPool: market.yesPool + market.noPool, [cite: 909]
    [cite_start]winnerCount, [cite: 910]
  [cite_start]}); [cite: 911]
[cite_start]}); [cite: 912]
```

### [cite_start]8.2 Yield Simulator (`yieldSimulator.ts`) [cite: 913]
[cite_start]MVP implementation: Simulated yield calculation based on declared trove balance and elapsed time. [cite: 914] [cite_start]The real Mezo trove yield stream is a post-hackathon integration. [cite: 915]
```typescript
[cite_start]// src/services/yieldSimulator.ts [cite: 916]

[cite_start]// Annual yield rate: 5% (simulated — confirm with Mezo docs for real rate) [cite: 917]
[cite_start]const ANNUAL_YIELD_RATE = 0.05; [cite: 918]
[cite_start]const SECONDS_PER_YEAR  = 31_536_000; [cite: 919]

[cite_start]export function calculateYield(troveBalance: bigint, openedAt: Date): bigint { [cite: 920]
  [cite_start]const elapsedSeconds = (Date.now() - openedAt.getTime()) / 1000; [cite: 921]
  [cite_start]const ratePerSecond  = (Number(troveBalance) * ANNUAL_YIELD_RATE) / SECONDS_PER_YEAR; [cite: 922]
  [cite_start]return BigInt(Math.floor(ratePerSecond * elapsedSeconds)); [cite: 923]
[cite_start]} [cite: 924]

[cite_start]// Example: 500 MUSD trove, 30 minutes elapsed [cite: 925]
[cite_start]// ratePerSecond = (500e18 * 0.05) / 31_536_000 ≈ 793_650_793 wei/sec [cite: 926]
[cite_start]// 30 min = 1800 sec → yield ≈ 1_428_571_428_000 wei ≈ 0.0014 MUSD [cite: 927]
[cite_start]// (adjust rate to make demo visually interesting) [cite: 928]
```

### [cite_start]8.3 Conviction Score (`convictionScore.ts`) [cite: 929]
```typescript
[cite_start]// src/services/convictionScore.ts [cite: 930]

[cite_start]export async function recalculate(groupId: string): Promise<void> { [cite: 931]
  [cite_start]const resolvedMarkets = await db.markets.getResolved(groupId); [cite: 932]

  [cite_start]for (const market of resolvedMarkets) { [cite: 933]
    [cite_start]const stakes = await db.stakes.getByMarket(market.id); [cite: 934]
    [cite_start]const totalPool = market.yesPool + market.noPool; [cite: 935]

    [cite_start]for (const stake of stakes) { [cite: 936]
      [cite_start]const isWinner = stake.direction === market.outcome; [cite: 937]
      const stakeWeight = Number(stake.amount) / Number(totalPool); [cite_start]// 0–1 [cite: 938]
      const delta = isWinner ? [cite_start]Math.round(stakeWeight * 1000) : 0; [cite: 939]

      [cite_start]await db.scores.increment(stake.userAddress, groupId, { [cite: 940]
        [cite_start]scoreDelta:    delta, [cite: 941]
        [cite_start]marketsPlayed: 1, [cite: 942]
        wins:          isWinner ? [cite_start]1 : 0, [cite: 943]
        [cite_start]totalStaked:   stake.amount, [cite: 944]
      [cite_start]}); [cite: 945]
    [cite_start]} [cite: 946]
  [cite_start]} [cite: 947]
[cite_start]} [cite: 948]

[cite_start]// Score interpretation: [cite: 949]
[cite_start]// 0–200:    Beginner [cite: 950]
[cite_start]// 200–500:  Developing [cite: 951]
[cite_start]// 500–800:  Confident [cite: 952]
[cite_start]// 800–1200: Sharp [cite: 953]
[cite_start]// 1200+:    Oracle [cite: 954]
```

### [cite_start]8.4 SIWE Authentication Middleware (`auth.ts`) [cite: 955]
```typescript
[cite_start]// src/middleware/auth.ts [cite: 956]
[cite_start]import { SiweMessage } from "siwe"; [cite: 957]

[cite_start]export async function requireAuth(req, res, next) { [cite: 958]
  [cite_start]const token = req.headers.authorization?.split(" ")[1]; [cite: 959]
  [cite_start]if (!token) return res.status(401).json({ error: "UNAUTHORIZED" }); [cite: 960]

  [cite_start]try { [cite: 961]
    [cite_start]const { message, signature } = JSON.parse(atob(token)); [cite: 962]
    [cite_start]const siwe = new SiweMessage(message); [cite: 963]
    [cite_start]const { data } = await siwe.verify({ signature }); [cite: 964]
    [cite_start]req.userAddress = data.address.toLowerCase(); [cite: 965]
    [cite_start]next(); [cite: 966]
  [cite_start]} catch { [cite: 967]
    [cite_start]res.status(401).json({ error: "INVALID_TOKEN" }); [cite: 968]
  [cite_start]} [cite: 969]
[cite_start]} [cite: 970]
```

---

## [cite_start]9. Environment Variables [cite: 971]

| Variable | Description | Required |
| :--- | :--- | :--- |
| [cite_start]`MEZO_RPC_URL` [cite: 972] | [cite_start]Mezo Testnet RPC endpoint (e.g. `https://rpc.mezo.testnet`) [cite: 972] | [cite_start]Yes [cite: 972] |
| [cite_start]`DEPLOYER_PRIVATE_KEY` [cite: 972] | Wallet private key for contract deployment only. [cite_start]Never for user funds. [cite: 972] | [cite_start]Yes [cite: 972] |
| [cite_start]`PREDICTION_MARKET_ADDRESS` [cite: 972] | [cite_start]Deployed PredictionMarket.sol address [cite: 972] | [cite_start]Yes (post-deploy) [cite: 972] |
| [cite_start]`GROUP_REGISTRY_ADDRESS` [cite: 972] | [cite_start]Deployed GroupRegistry.sol address [cite: 972] | [cite_start]Yes (post-deploy) [cite: 972] |
| [cite_start]`MANDATE_VALIDATOR_ADDRESS` [cite: 972] | [cite_start]Deployed MandateValidator.sol address [cite: 972] | [cite_start]Yes (post-deploy) [cite: 972] |
| [cite_start]`MUSD_ADDRESS` [cite: 972] | [cite_start]MUSD ERC-20 contract address on Mezo Testnet [cite: 972] | [cite_start]Yes [cite: 972] |
| [cite_start]`MEZO_PROTOCOL_FEE_ADDRESS` [cite: 972] | [cite_start]Protocol fee recipient (hardcoded in contract — must match) [cite: 972] | [cite_start]Yes [cite: 972] |
| [cite_start]`MEZO_CDP_ADDRESS` [cite: 972] | [cite_start]Mezo CDP contract (for onboarding MUSD minting redirect) [cite: 972] | [cite_start]Yes [cite: 972] |
| [cite_start]`PASSPORT_SDK_KEY` [cite: 972] | [cite_start]Mezo Passport SDK API key (if required) [cite: 972] | [cite_start]Yes [cite: 972] |
| [cite_start]`DATABASE_URL` [cite: 972] | [cite_start]PostgreSQL/SQLite connection string (Railway auto-injects for Postgres) [cite: 972] | [cite_start]Yes [cite: 972] |
| [cite_start]`PORT` [cite: 972] | [cite_start]Express server port (Railway injects this — default 3001) [cite: 972] | [cite_start]No [cite: 972] |
| [cite_start]`SIWE_DOMAIN` [cite: 972] | [cite_start]Domain for SIWE authentication (presight.vercel.app) [cite: 972] | [cite_start]Yes [cite: 972] |
| [cite_start]`CORS_ORIGIN` [cite: 972] | [cite_start]Allowed CORS origin (`https://presight.vercel.app`) [cite: 972] | [cite_start]Yes [cite: 972] |
| [cite_start]`MEZO_EXPLORER_API_KEY` [cite: 972] | [cite_start]For contract verification on Mezo Testnet explorer [cite: 972] | [cite_start]Yes [cite: 972] |

```env
# [cite_start].env.example [cite: 973]
[cite_start]MEZO_RPC_URL=https://rpc.mezo.testnet [cite: 974]
[cite_start]DEPLOYER_PRIVATE_KEY=0x... [cite: 975]
[cite_start]PREDICTION_MARKET_ADDRESS=           # fill after deploy [cite: 976]
[cite_start]GROUP_REGISTRY_ADDRESS=              # fill after deploy [cite: 977]
[cite_start]MANDATE_VALIDATOR_ADDRESS=           # fill after deploy [cite: 978]
[cite_start]MUSD_ADDRESS=0x... [cite: 979]
[cite_start]MEZO_PROTOCOL_FEE_ADDRESS=0x... [cite: 980]
[cite_start]MEZO_CDP_ADDRESS=0x... [cite: 981]
[cite_start]PASSPORT_SDK_KEY= [cite: 982]
[cite_start]DATABASE_URL=file:./presight.db      # SQLite for local dev [cite: 983]
[cite_start]SIWE_DOMAIN=presight.vercel.app [cite: 984]
[cite_start]CORS_ORIGIN=https://presight.vercel.app [cite: 985]
[cite_start]MEZO_EXPLORER_API_KEY= [cite: 986]
```

---

## [cite_start]10. Testing Strategy [cite: 987]
### [cite_start]10.1 Smart Contract Tests (Hardhat + Chai) [cite: 988]
[cite_start]Run before every deploy. [cite: 989] [cite_start]All tests must pass before Week 1 gate. [cite: 989]
```bash
# [cite_start]Run all contract tests [cite: 990]
[cite_start]npx hardhat test [cite: 991]

# [cite_start]Run specific test file [cite: 992]
[cite_start]npx hardhat test test/PredictionMarket.test.ts [cite: 993]
```

[cite_start]**Required Test Cases — PredictionMarket.sol** [cite: 994]
* [cite_start]Full stake lifecycle: create → stake YES → stake NO → resolve YES → verify winners receive proportional MUSD [cite: 995]
* [cite_start]Fee routing: verify exactly 1% of total pool sent to `protocolFeeAddr` on every resolution [cite: 996]
* [cite_start]Resolver-only resolution: non-resolver address calling `resolve()` must revert [cite: 997]
* [cite_start]Deadline enforcement: stake after deadline must revert [cite: 998]
* [cite_start]Mandate exceeded: stake exceeding mandate limit must revert (via MandateValidator) [cite: 999]
* [cite_start]One-stake-per-user: second stake by same user on same market must revert [cite: 1000]
* [cite_start]Zero distribution guard: if all stakes on one side, refund all stakers (minus fee) [cite: 1001]
* [cite_start]ReentrancyGuard: verify reentrancy attack on `stake()` reverts cleanly [cite: 1002]
* [cite_start]MUSD transfer verification: all distributions arrive at correct wallet addresses [cite: 1003]

[cite_start]**Required Test Cases — GroupRegistry.sol** [cite: 1004]
* [cite_start]Group creation: `createGroup` returns valid `bytes32 groupId`, emits `GroupCreated` [cite: 1005]
* [cite_start]Membership: `joinGroup` adds member, `isGroupMember` returns true [cite: 1006]
* [cite_start]Resolver assignment: admin can assign resolver, non-admin reverts [cite: 1007]
* [cite_start]Duplicate join: joining same group twice should be idempotent or revert cleanly [cite: 1008]

### [cite_start]10.2 API Integration Tests [cite: 1009]
```bash
# [cite_start]Run API tests (Jest) [cite: 1010]
[cite_start]npm test [cite: 1011]

# [cite_start]With coverage [cite: 1012]
[cite_start]npm run test:coverage [cite: 1013]
```

| Test | Expected Result |
| :--- | :--- |
| [cite_start]POST /stakes — valid mandate [cite: 1014] | [cite_start]201, txHash returned, stake recorded in DB [cite: 1014] |
| [cite_start]POST /stakes — mandate exceeded [cite: 1014] | [cite_start]422, MANDATE_EXCEEDED error with limit and attempted amounts [cite: 1014] |
| [cite_start]POST /stakes — already staked [cite: 1014] | [cite_start]409, ALREADY_STAKED error [cite: 1014] |
| [cite_start]POST /stakes — market closed [cite: 1014] | [cite_start]400, MARKET_CLOSED error [cite: 1014] |
| [cite_start]POST /resolver/:id/resolve — non-resolver caller [cite: 1014] | [cite_start]403, NOT_RESOLVER error [cite: 1014] |
| [cite_start]POST /resolver/:id/resolve — valid resolver [cite: 1014] | [cite_start]200, txHash, distribution confirmed [cite: 1014] |
| [cite_start]GET /yield/:address/:marketId — no trove position [cite: 1014] | [cite_start]404, NO_TROVE_POSITION [cite: 1014] |
| [cite_start]GET /yield/:address/:marketId — valid trove [cite: 1014] | [cite_start]200, accruedAmount > 0 [cite: 1014] |
| [cite_start]GET /leaderboard/:groupId — sorted correctly [cite: 1014] | [cite_start]Entries ordered by convictionScore DESC [cite: 1014] |

### [cite_start]10.3 End-to-End Demo Cycles (Week 4) [cite: 1015]
[cite_start]Must complete 5 full cycles with 2 distinct wallets before submission. [cite: 1016] [cite_start]Each cycle: create market → both wallets stake → resolver resolves → verify MUSD arrives in winner wallets within 30 seconds. [cite: 1017]

| Cycle | Mode | Verify |
| :--- | :--- | :--- |
| [cite_start]1 [cite: 1018] | [cite_start]Full Stake [cite: 1018] | 1% fee routed to protocol address. [cite_start]Winners receive proportional share. [cite: 1018] |
| [cite_start]2 [cite: 1018] | [cite_start]Full Stake [cite: 1018] | [cite_start]Both wallets on same side (YES) — verify loser pool distribution still correct. [cite: 1018] |
| [cite_start]3 [cite: 1018] | [cite_start]Zero Risk [cite: 1018] | [cite_start]Yield counter visible, only accrued yield at stake, principal unchanged after loss. [cite: 1018] |
| [cite_start]4 [cite: 1018] | [cite_start]Full Stake [cite: 1018] | [cite_start]Large MUSD pool — verify reward delivery < 30s after resolution. [cite: 1018] |
| [cite_start]5 [cite: 1018] | [cite_start]Zero Risk [cite: 1018] | Winner receives proportional yield pool. [cite_start]Principal untouched for both winner and loser. [cite: 1018] |

---

## [cite_start]11. Deployment [cite: 1019]
### [cite_start]11.1 Local Development [cite: 1020]
```bash
[cite_start]git clone https://github.com/your-org/presight-backend [cite: 1021]
[cite_start]cd presight-backend [cite: 1022]
[cite_start]npm install [cite: 1023]
[cite_start]cp .env.example .env [cite: 1024]

# [cite_start]Start local dev server (Express + WebSocket + event listener) [cite: 1025]
[cite_start]npm run dev [cite: 1026]

# [cite_start]Start local Hardhat node (optional — for contract testing without testnet) [cite: 1027]
[cite_start]npx hardhat node [cite: 1028]

# [cite_start]Deploy contracts to local Hardhat node [cite: 1029]
[cite_start]npx hardhat run scripts/deploy.ts --network localhost [cite: 1030]
```

### [cite_start]11.2 Railway Deployment [cite: 1031]
* Connect GitHub repo to Railway. [cite_start]Auto-deploys on push to main. [cite: 1032]
* [cite_start]`railway.json` specifies build command (`npm run build`) and start command (`npm run start`). [cite: 1033]
* [cite_start]Set all environment variables in Railway project → Variables panel [cite: 1034]
* [cite_start]Railway auto-injects `DATABASE_URL` when a PostgreSQL addon is attached [cite: 1035]
* [cite_start]Share deployed URL with frontend team: `https://presight-api.railway.app` [cite: 1036]

```json
[cite_start]// railway.json [cite: 1037]
[cite_start]{ [cite: 1038]
  [cite_start]"build": { "builder": "NIXPACKS" }, [cite: 1039]
  [cite_start]"deploy": { [cite: 1040]
    [cite_start]"startCommand": "npm run start", [cite: 1041]
    [cite_start]"healthcheckPath": "/health", [cite: 1042]
    [cite_start]"restartPolicyType": "ON_FAILURE" [cite: 1043]
  [cite_start]} [cite: 1044]
[cite_start]} [cite: 1045]
```

### [cite_start]11.3 Week 1 Deploy Checklist [cite: 1046]
* [cite_start][ ] All 3 contracts deployed to Mezo Testnet (Chain ID 31611) [cite: 1047]
* [cite_start][ ] All 3 contracts verified on Mezo Testnet explorer [cite: 1048]
* [cite_start][ ] Contract addresses added to `.env` (local) and Railway env vars [cite: 1049]
* [cite_start][ ] Contract addresses shared with frontend team (`NEXT_PUBLIC_` vars) [cite: 1050]
* [cite_start][ ] Railway API service live and reachable from Vercel frontend [cite: 1051]
* [cite_start][ ] WebSocket connection tested end-to-end (connect, send event, receive broadcast) [cite: 1052]
* [cite_start][ ] 2-wallet stake + resolution test completed on Mezo Testnet [cite: 1053]
* [cite_start][ ] 1% fee verified arriving at `MEZO_PROTOCOL_FEE_ADDRESS` [cite: 1054]
* [cite_start][ ] MUSD auto-distribution verified in winner wallet within 30 seconds [cite: 1055]

---

## [cite_start]12. Performance & Security [cite: 1056]
### [cite_start]12.1 Performance Targets [cite: 1057]

| Metric | Target | Measured Where |
| :--- | :--- | :--- |
| [cite_start]Stake tx time (Passport mandate) [cite: 1058] | [cite_start]≤3 seconds [cite: 1058] | [cite_start]POST /stakes response time [cite: 1058] |
| [cite_start]WebSocket stake broadcast latency [cite: 1058] | [cite_start]≤500ms [cite: 1058] | [cite_start]From DB write to client receipt [cite: 1058] |
| [cite_start]Market resolution + auto-distribution [cite: 1058] | [cite_start]≤30 seconds [cite: 1058] | [cite_start]From /resolve call to RewardsDistributed event [cite: 1058] |
| [cite_start]Yield counter response time [cite: 1058] | [cite_start]≤200ms [cite: 1058] | [cite_start]GET /yield response time [cite: 1058] |
| [cite_start]API p95 response time [cite: 1058] | [cite_start]≤500ms [cite: 1058] | [cite_start]All GET endpoints [cite: 1058] |
| [cite_start]WebSocket connections supported [cite: 1058] | [cite_start]≥50 concurrent [cite: 1058] | [cite_start]Demo requirement: 2 wallets + judges [cite: 1058] |

### [cite_start]12.2 Rate Limiting [cite: 1059]
```typescript
[cite_start]// src/middleware/rateLimit.ts [cite: 1060]
[cite_start]// Per-wallet limits to prevent spam staking [cite: 1061]
[cite_start]const stakeLimiter = rateLimit({ [cite: 1062]
  [cite_start]windowMs: 60_000,  // 1 minute [cite: 1063]
  [cite_start]max: 10,           // 10 stakes per wallet per minute [cite: 1064]
  [cite_start]keyGenerator: (req) => req.userAddress, [cite: 1065]
[cite_start]}); [cite: 1066]

[cite_start]// Apply to stake route only [cite: 1067]
[cite_start]router.post("/stakes", requireAuth, stakeLimiter, stakeHandler); [cite: 1068]
```

### [cite_start]12.3 Security Checklist [cite: 1069]

| Risk | Mitigation |
| :--- | :--- |
| [cite_start]Mandate overspend [cite: 1070] | Server validates amount <= mandate.limitPerMarket before EVERY stake call. [cite_start]HTTP 422 on violation. [cite: 1070] |
| [cite_start]Non-resolver resolution [cite: 1070] | Backend checks caller address matches resolver on-chain. [cite_start]Contract also enforces with onlyResolver modifier. [cite: 1070] |
| [cite_start]Replay attacks on SIWE tokens [cite: 1070] | SIWE nonce validation. [cite_start]Tokens are single-use and scoped to SIWE_DOMAIN. [cite: 1070] |
| [cite_start]Contract reentrancy [cite: 1070] | [cite_start]OpenZeppelin ReentrancyGuard on all MUSD transfer functions in PredictionMarket.sol. [cite: 1070] |
| [cite_start]Private key exposure [cite: 1070] | DEPLOYER_PRIVATE_KEY only used for initial deploy and fallback signing. Never logged. [cite_start]Rotate post-hackathon. [cite: 1070] |
| [cite_start]Fee bypass [cite: 1070] | FEE_BPS = 100 is immutable contract constant. [cite_start]No backend or frontend call can change it. [cite: 1070] |
| [cite_start]Unauthorized group admin actions [cite: 1070] | [cite_start]GroupRegistry.assignResolver() checks msg.sender == group.admin on-chain. [cite: 1070] |
| [cite_start]CORS abuse [cite: 1070] | [cite_start]CORS_ORIGIN restricts to Vercel frontend domain only. [cite: 1070] |

---

## [cite_start]13. Quick Reference [cite: 1071]
### [cite_start]13.1 Dependency List [cite: 1072]

| Package | Version | Purpose |
| :--- | :--- | :--- |
| [cite_start]`express` [cite: 1073] | [cite_start]4.x [cite: 1073] | [cite_start]HTTP server framework [cite: 1073] |
| [cite_start]`ws` [cite: 1073] | [cite_start]8.x [cite: 1073] | [cite_start]WebSocket server [cite: 1073] |
| [cite_start]`ethers` [cite: 1073] | [cite_start]6.x [cite: 1073] | [cite_start]Contract interaction, event listening [cite: 1073] |
| [cite_start]`hardhat` [cite: 1073] | [cite_start]2.x [cite: 1073] | [cite_start]Solidity compile, test, deploy [cite: 1073] |
| [cite_start]`@openzeppelin/contracts` [cite: 1073] | [cite_start]5.x [cite: 1073] | [cite_start]ReentrancyGuard, ERC-20 interface [cite: 1073] |
| [cite_start]`siwe` [cite: 1073] | [cite_start]2.x [cite: 1073] | [cite_start]Sign-In With Ethereum authentication [cite: 1073] |
| [cite_start]`better-sqlite3` [cite: 1073] | [cite_start]9.x [cite: 1073] | [cite_start]SQLite DB for hackathon MVP [cite: 1073] |
| [cite_start]`pg` [cite: 1073] | [cite_start]8.x [cite: 1073] | [cite_start]PostgreSQL client (production / Railway) [cite: 1073] |
| [cite_start]`mezo-passport-sdk` [cite: 1073] [cite_start]| latest [cite: 1073] | [cite_start]Gasless Passport mandate integration [cite: 1073] |
| [cite_start]`express-rate-limit` [cite: 1073] | [cite_start]7.x [cite: 1073] | [cite_start]Per-wallet rate limiting [cite: 1073] |
| [cite_start]`zod` [cite: 1073] | [cite_start]3.x [cite: 1073] | [cite_start]Request validation / schema parsing [cite: 1073] |
| [cite_start]`winston` [cite: 1073] | [cite_start]3.x [cite: 1073] | [cite_start]Structured logging [cite: 1073] |
| [cite_start]`jest` [cite: 1073] | [cite_start]29.x [cite: 1073] | [cite_start]Unit and integration test runner [cite: 1073] |
| [cite_start]`chai` [cite: 1073] | [cite_start]4.x [cite: 1073] | [cite_start]Contract test assertions (Hardhat) [cite: 1073] |
| [cite_start]`typechain` [cite: 1073] | [cite_start]8.x [cite: 1073] | [cite_start]TypeScript types from contract ABIs [cite: 1073] |

### [cite_start]13.2 Useful Commands [cite: 1074]
```bash
# [cite_start]Contracts [cite: 1075]
[cite_start]npx hardhat compile                            # compile Solidity [cite: 1076]
[cite_start]npx hardhat test                               # run all contract tests [cite: 1077]
[cite_start]npx hardhat run scripts/deploy.ts --network mezoTestnet [cite: 1078]
[cite_start]npx hardhat verify --network mezoTestnet <addr> <args...> [cite: 1079]

# [cite_start]API [cite: 1080]
[cite_start]npm run dev          # dev server with hot reload (ts-node-dev) [cite: 1081]
[cite_start]npm run build        # compile TypeScript → dist/ [cite: 1082]
[cite_start]npm run start        # start compiled server (Railway) [cite: 1083]
[cite_start]npm test             # Jest API tests [cite: 1084]
[cite_start]npm run type-check   # TypeScript type check without emit [cite: 1085]

# [cite_start]DB (SQLite) [cite: 1086]
[cite_start]npm run db:migrate   # run schema migrations [cite: 1087]
[cite_start]npm run db:seed      # seed test data for local dev [cite: 1088]

# [cite_start]Railway [cite: 1089]
[cite_start]railway up           # manual deploy trigger [cite: 1090]
[cite_start]railway logs         # tail live logs [cite: 1091]
[cite_start]railway shell        # open Railway shell for debugging [cite: 1092]
```

### [cite_start]13.3 Integration Sync Points with Frontend Team [cite: 1093]
| What to Share | When | Format |
| :--- | :--- | :--- |
| [cite_start]Contract addresses (all 3) [cite: 1094] | [cite_start]End of Week 1 (after deploy) [cite: 1094] | [cite_start]Add to frontend .env.local as NEXT_PUBLIC_* vars [cite: 1094] |
| [cite_start]ABI JSON files [cite: 1094] | [cite_start]End of Week 1 (from hardhat artifacts) [cite: 1094] | [cite_start]Copy to frontend lib/abis/ or share via repo [cite: 1094] |
| [cite_start]Railway API base URL [cite: 1094] | [cite_start]End of Week 1 [cite: 1094] | [cite_start]NEXT_PUBLIC_BACKEND_URL env var [cite: 1094] |
| [cite_start]Railway WebSocket URL [cite: 1094] | [cite_start]End of Week 1 [cite: 1094] | [cite_start]NEXT_PUBLIC_WS_URL env var [cite: 1094] |
| [cite_start]MUSD token address [cite: 1094] | [cite_start]Day 1 (from Mezo docs) [cite: 1094] | [cite_start]NEXT_PUBLIC_MUSD_ADDRESS env var [cite: 1094] |
| [cite_start]Mezo CDP URL [cite: 1094] | [cite_start]Day 1 [cite: 1094] | [cite_start]NEXT_PUBLIC_MEZO_CDP_URL env var [cite: 1094] |
| [cite_start]Error code list [cite: 1094] | [cite_start]End of Week 1 [cite: 1094] | [cite_start]Share this doc section 4.3 error codes [cite: 1094] |