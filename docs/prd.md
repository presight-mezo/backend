# Presight: Social Bitcoin Prediction Markets

### Product Requirement Document (PRD) — Mezo Hackathon: Track 2 (MUSD Track)
### Combined Design: Presight + Predictly

---

## Background

### Problem Statement

Bitcoin is the largest and most secure asset in crypto, yet its usage remains largely passive — held as a store of value rather than actively deployed in social or interactive financial applications. Meanwhile, prediction markets have proven explosive demand: platforms like Polymarket and Kalshi have processed tens of billions in volume, with weekly prediction activity reaching nearly **$4 billion across over 10 million transactions per week** between early 2024 and late 2025.

Despite this scale, existing prediction market platforms suffer from three structural failures:

- **They are not social.** All major platforms are designed for anonymous, public speculation — not for trusted friend groups or communities who want to predict together with shared context and accountability.
- **They are all-or-nothing.** Users must risk their full principal to participate, limiting adoption to experienced traders and excluding the far larger population of risk-averse casual users who want engagement without capital loss.
- **They have no Bitcoin-native integration.** Virtually all prediction markets use USDC or ETH, leaving Bitcoin's $1T+ capital base entirely untapped and offering no utility surface for HODLers who have minted MUSD against their BTC collateral.

Simultaneously, Mezo users who have minted MUSD face a scarcity of consumer-facing, socially engaging outlets. Yield vaults exist — but they are passive and isolating. There is no product that makes staking MUSD feel fun, social, or tied to real-world conviction.

This creates a clear, addressable gap: **a social prediction market platform where MUSD is the native staking currency, risk is flexible, and community trust replaces anonymous arbitration.**

---

### Market Opportunity

- Prediction markets processed over $3.5B in monthly volume in 2024 and are growing as a recognized financial primitive
- SocialFi is a dominant and underserved Web3 category — platforms like Farcaster and Friend.tech demonstrated strong product-market fit despite immature infrastructure
- The unserved segment is large: casual users, friend groups, DAOs, and Bitcoin communities who want prediction engagement but are excluded by all-or-nothing capital risk and anonymous, public market formats
- MUSD is uniquely positioned as the ideal prediction staking asset: dollar-stable for risk management, Bitcoin-native for HODLer alignment, and gasless via Mezo Passport for frictionless UX

By combining **Bitcoin + Social + Prediction Markets**, Presight unlocks a new category: **Social Bitcoin Finance** — where MUSD is the currency of community conviction and every group prediction is a social act backed by real Bitcoin equity.

---

### User Personas

**The Social Casual — Maya**
- Age: 26, Marketing professional, Jakarta
- Crypto experience: Minimal — has heard of Bitcoin, never used DeFi
- Motivation: Wants to join fun group predictions (sports results, BTC price milestones, pop culture events) with colleagues without risking real money
- Pain points: Scared of losing principal, confused by gas fees, intimidated by crypto wallets
- Goal: Join a group market, stake only the yield from her BTC position (never the principal), win social recognition and a small MUSD reward
- Key need: **Zero Risk Mode** — real-time yield accumulation display, principal never touched, participates purely on generated MUSD yield

**The Crypto Enthusiast — Rafi**
- Age: 31, DeFi-native, active Mezo trove holder with 0.5 BTC locked
- Crypto experience: High — uses Uniswap, Aave, and Mezo regularly; MUSD accumulating with limited spending outlets
- Motivation: Wants high-conviction MUSD stakes, meaningful rewards, and a competitive social layer that makes DeFi feel engaging
- Pain points: Existing prediction markets feel anonymous and soulless; no socially competitive format for Bitcoin-native users
- Goal: Create a private group with fellow Bitcoiners, stake 100+ MUSD per market in Full Stake Mode, track performance on a public leaderboard
- Key need: **Full Stake (Degen) Mode** — direct MUSD staking with proportional reward pools and a Conviction Score leaderboard

**The Community Builder — Aiko**
- Age: 35, runs a Bitcoin-focused DAO and Telegram community of 800 members
- Crypto experience: Moderate — understands wallets and governance, less familiar with DeFi mechanics
- Motivation: Needs engagement tools to keep her community active between major Bitcoin events; real financial stakes create accountability that polls can't
- Pain points: Existing community tools (polls, bots) are disconnected from financial stakes; members lose interest without skin in the game
- Goal: Create themed prediction markets (BTC price targets, ETF flow outcomes, halving effects), assign a trusted community member as resolver, invite members via link
- Key need: **Trusted Resolver Role** — assignable, separate from group admin, eliminates oracle dependency with community-native accountability

---

### Vision Statement

Presight transforms Bitcoin from a passive store of value into an active social financial layer — where MUSD is the currency of community conviction and every prediction is a social act backed by real Bitcoin equity. Our goal is to make participating in Bitcoin-based financial activity as natural as chatting with friends: simple, social, and engaging, with Mezo Passport making every stake gasless and every mandate trustless. Unlike existing prediction markets designed for anonymous speculation, Presight is built for **repeat social engagement within trusted communities** — shared decisions, not isolated bets.

---

### Product Origin

Presight emerged from two simultaneous observations: prediction markets are powerful engagement primitives but lack social context and Bitcoin-native assets; and Mezo's MUSD has no consumer-facing "fun" outlet beyond passive yield vaults. The product design synthesizes the best of two parallel approaches: deep MUSD and Mezo Passport integration (making Bitcoin the financial backbone), and the social-first, zero-risk, trusted-resolver model pioneered by community prediction platforms like Predictly — adapted and rebuilt natively for the Mezo ecosystem.

---

## Objectives

### SMART Goals

- **Specific:** Launch a working MVP of Presight on Mezo Testnet where users mint MUSD via Mezo Passport, stake it into group prediction markets using either Full Stake or Zero Risk Mode, with outcomes resolved by an assigned Trusted Resolver and MUSD rewards auto-distributed on-chain — all without manual gas approval per transaction
- **Measurable:** Demonstrate at least 5 full prediction cycles (create → stake MUSD → resolve → auto-distribute MUSD rewards) during the judging demo, across at least 2 distinct wallets in the same market, with at least 1 Zero Risk Mode and 1 Full Stake Mode market demonstrated
- **Achievable:** Built with Mezo Passport smart account mandates for gasless staking, a scoped YES/NO Solidity escrow contract on Mezo Testnet (Chain ID 31611), and a Next.js frontend deployable on Vercel
- **Relevant:** MUSD is the exclusive staking currency across all prediction markets; Mezo Passport mandate logic is the core UX innovation; a 1% MUSD platform fee per resolved market flows back into the Mezo protocol — creating direct protocol revenue alignment
- **Time-bound:** Fully deployed on Mezo Testnet with live demo within the 4-week hackathon window

---

### Key Performance Indicators (KPIs)

| Metric | Target |
|---|---|
| Prediction markets created during demo | ≥5 |
| Full cycles completed (create → stake → resolve → claim) | 100% of demo markets |
| MUSD staking transaction success rate | ≥95% |
| Mezo Passport mandate setup success rate | 100% |
| Unique wallets participating in same market | ≥2 |
| Zero Risk Mode markets demonstrated | ≥1 |
| Full Stake Mode markets demonstrated | ≥1 |
| Time to first prediction (new user) | ≤3 minutes |
| Platform fee (MUSD) routed to protocol per market | 1% of total pool |

---

### Qualitative Objectives

- Make MUSD feel like a **social currency** — something you stake to back your conviction, not just to earn yield
- Eliminate gas anxiety entirely through **Mezo Passport mandate-based staking** — approve once, stake gaslessly forever after
- Make Zero Risk Mode **visibly reassuring** — a real-time counter showing "Your yield so far: 0.42 MUSD" makes principal safety tangible, not theoretical
- Deliver a **consumer-grade UX** that a non-DeFi user can navigate in under 3 minutes — no blockchain jargon on primary screens

---

### Strategic Alignment

Presight advances Mezo's core mission across three dimensions. First, it creates a high-frequency MUSD utility surface — every market is a staking and reward distribution event, generating protocol activity and Passport adoption. Second, the 1% MUSD platform fee per resolved market creates direct protocol revenue, aligning Presight's commercial success with Mezo's health. Third, it directly targets the "Bazaar" roadmap category — the permissionless SocialFi and GameFi playground Mezo has explicitly prioritised for 2025–2026 builder programs.

---

### Risk Mitigation

| Risk | Mitigation |
|---|---|
| Smart contract bugs in escrow or resolution logic | Scope contracts to YES/NO binary markets only; manual Trusted Resolver (no oracle) eliminates external dependency; deploy and test 5 full cycles 48 hours before submission |
| Mezo Passport mandate integration complexity | Spike on mandate setup in Days 1–2; fallback to standard wagmi wallet signing if mandate API is blocked; Passport is a UX enhancement, not a functional blocker |
| Zero Risk Mode yield stream complexity in 4 weeks | Simulate yield accumulation with a time-based rate calculation at MVP; real Mezo trove yield stream is a post-hackathon integration milestone |
| Scope creep | Hard MVP cap: group creation, MUSD staking (both modes), YES/NO markets, Trusted Resolver, auto-distribution — nothing else |
| Mezo Testnet instability during demo | Pre-record 90-second fallback demo video; cache last successful transfer state for UI stability |
| Judges unfamiliar with DeFi | Demo script leads with human story ("Maya stakes her yield to call BTC above $120K — zero risk to her Bitcoin") before any technical detail |

---

## Features

### Core Features

**1. MUSD-Powered Prediction Staking**
MUSD is the exclusive staking currency across all markets. Users who don't yet hold MUSD are prompted during onboarding to mint MUSD against their BTC collateral via Mezo's CDP contract — turning the product's entry point into a Mezo protocol interaction. Minimum stake: 1 MUSD. All stakes are locked in the Presight escrow smart contract on Mezo Testnet until market resolution. A 1% platform fee is deducted from the total MUSD pool at resolution and routed to a Mezo protocol fee address — creating a direct commercial alignment between Presight's activity volume and Mezo's protocol health.

**2. Mezo Passport Mandate-Based Staking**
The core UX innovation. During onboarding, users connect their Mezo Passport and set a **Prediction Mandate**: a maximum MUSD spend per market (e.g., "allow Presight to stake up to 50 MUSD per prediction"). All subsequent staking actions within that mandate execute gaslessly and instantly — no wallet popup, no gas approval, no friction between conviction and action. This mirrors the UX of a credit card spend limit and is what makes Presight feel like a consumer app rather than a DeFi protocol. The mandate scope is validated server-side before every stake to prevent overspending even if the frontend is compromised.

**3. Dual Risk Modes**
Both modes use MUSD as the staking currency. The mode is selected per market at creation time and displayed clearly on every market card.

- **Full Stake (Degen) Mode:** Users stake MUSD principal directly into the escrow contract. Winners receive a proportional share of the losing side's MUSD pool, minus the 1% platform fee. Designed for Rafi-type crypto enthusiasts who want meaningful stakes and competitive returns.
- **Zero Risk Mode:** Users' MUSD principal is never at risk. Instead, the platform calculates a time-based yield accrual rate based on the user's Mezo trove position (simulated at MVP; real trove stream in post-hackathon v2) and stakes only the generated yield. A live counter displays "Your yield so far: X MUSD" during the market window — making the zero-risk guarantee visible and reassuring, not just stated. Losers forfeit only the accrued yield; principal is untouched. Designed for Maya-type casual users.

**4. Social Group Markets with Trusted Resolver**
Users create private prediction groups and invite members via a shareable link. Each group supports multiple simultaneous YES/NO markets. Crucially, the **Trusted Resolver is a distinct assignable role, separate from the group admin.** The market creator designates a trusted community member — not an oracle, not the group admin by default — as the resolver for each market. This eliminates oracle dependency, reduces the admin's conflict of interest in markets they participate in, and creates community-native accountability that Aiko-type community builders will immediately recognise from real-world trusted arbitration models. On resolution, the Trusted Resolver triggers the outcome on-chain; the smart contract auto-distributes MUSD to winners.

**5. Live Stake Feed & Market Cards**
Each market card displays in real time: the question, current YES/NO stake totals as a live progress bar, number of participants, time remaining, risk mode, and the resolver's identity. A WebSocket-powered live feed within each group shows each stake event as it occurs — creating social pressure and FOMO that drives engagement. Group members see each other's positions (amount staked and direction) after they have placed their own stake, preventing position-copying while maintaining social accountability.

**6. Prediction Profile & Conviction Score**
Every user has a public prediction profile showing: total markets participated in, win rate, total MUSD staked, total MUSD won/lost, and a **Conviction Score** — a weighted accuracy metric that rewards correct high-stake predictions more than low-stake ones, discouraging random hedging and rewarding genuine conviction. Profiles are shareable — a social incentive to build a public track record. A group leaderboard ranks members by Conviction Score, creating ongoing competitive engagement between markets.

**7. Monetisation Model**
A 1% MUSD platform fee is deducted from every resolved market's total pool and routed to the Mezo protocol fee address. This is non-negotiable at the smart contract level — it cannot be bypassed by the group admin or resolver. Post-hackathon: a subscription tier (Community Plan, DAO Plan) unlocks higher stake limits, private market analytics, and featured placement on a public market discovery feed.

---

### User Benefits

- **Casual Users (Maya):** Zero Risk Mode lets them participate in fun group predictions using only BTC yield — no capital loss possible, no gas fees, no crypto knowledge required beyond connecting Mezo Passport
- **Crypto Enthusiasts (Rafi):** Full Stake Mode with meaningful MUSD pools, public Conviction Score leaderboard, and a social layer that makes DeFi feel competitive and human
- **Community Builders (Aiko):** A plug-and-play engagement tool with assignable Trusted Resolver roles, shareable invite links, and real financial stakes that make community predictions feel consequential

---

### Technical Specifications

- **Smart Contracts:** Solidity — `PredictionMarket.sol` (escrow, staking, resolution, reward distribution, 1% fee routing), `GroupRegistry.sol` (group creation and membership), `MandateValidator.sol` (Mezo Passport mandate scope verification)
- **Network:** Mezo Testnet (Chain ID 31611)
- **Wallet / Identity:** Mezo Passport (smart account abstraction, mandate-based gasless staking)
- **MUSD Integration:** Mezo CDP contract for MUSD minting at onboarding; MUSD ERC-20 transfer for staking and reward distribution; 1% fee transfer to Mezo protocol address at resolution
- **Frontend:** Next.js 14, TailwindCSS, RainbowKit for Passport connection
- **Backend:** Node.js / Express — group state, yield rate simulation (Zero Risk Mode), WebSocket for real-time stake feed

---

### Feature Prioritization (MoSCoW)

| Priority | Feature |
|---|---|
| **Must Have** | MUSD staking into prediction escrow (Full Stake Mode) |
| **Must Have** | Mezo Passport mandate setup (gasless staking) |
| **Must Have** | Group creation + shareable invite link |
| **Must Have** | YES/NO market creation and voting |
| **Must Have** | Assignable Trusted Resolver role (distinct from group admin) |
| **Must Have** | Automatic MUSD reward distribution on resolution |
| **Must Have** | 1% MUSD platform fee routed to Mezo protocol on resolution |
| **Should Have** | Zero Risk Mode (simulated yield accrual + live counter) |
| **Should Have** | Real-time stake feed (WebSocket) within groups |
| **Should Have** | Prediction history + win rate + Conviction Score |
| **Could Have** | Group leaderboard ranked by Conviction Score |
| **Could Have** | Shareable "I won" result card for X/Twitter |
| **Won't Have** | Oracle-based auto-resolution (post-hackathon) |
| **Won't Have** | Subscription tiers (post-hackathon) |
| **Won't Have** | Public market discovery feed (post-hackathon) |
| **Won't Have** | Real Mezo trove yield stream for Zero Risk Mode (post-hackathon) |

---

### Future Enhancements

- **Oracle-Based Resolution:** Integrate Chainlink or Pyth price feeds for trustless auto-resolution of BTC price prediction markets — eliminating the Trusted Resolver requirement for quantitative markets
- **Real Mezo Trove Yield Streaming:** Deep integration with Mezo yield vaults to stream live BTC yield directly into Zero Risk Mode stakes, replacing the simulated accrual rate with real on-chain yield
- **Subscription Plans:** Community Plan and DAO Plan unlocking higher stake limits, private analytics dashboards, and premium resolver features — targeting $10–$50/month per community
- **Public Market Discovery:** A Presight marketplace where any user can browse and join open prediction markets, expanding beyond closed groups to a public social feed
- **Multi-Outcome Markets:** Expand beyond YES/NO to categorical outcomes (e.g., "Which range will BTC close in this week?")
- **MEZO Token Integration:** Stake MEZO alongside MUSD to unlock premium features — higher stake limits, reduced platform fees, or enhanced Conviction Score multipliers

---

## User Experience

### UI Design

**Design Principles:** Social-first, stakes-visible, friction-zero. The interface should feel closer to a group chat with financial stakes than a DeFi protocol. Every market card shows the question, current YES/NO stake split as a live bar, total MUSD at stake, risk mode badge (ZERO RISK / FULL STAKE), and time remaining — at a glance, before any taps. Blockchain terminology (MUSD, CDP, Passport, mandate, escrow) appears only in an expandable "How it works" panel; all primary CTAs use plain language ("Back YES — stake 10 MUSD", "Claim your winnings").

**Visual Style:** Dark mode primary. Bitcoin orange (#F7931A) for Full Stake Mode accents; Mezo teal (#00C2A8) for Zero Risk Mode accents and the "safe" state. Card-based layout with large YES/NO action buttons. Group member count and resolver identity displayed on every market card. Mobile-first with bottom sheet interactions for staking flows.

**Zero Risk Mode Visual Treatment:** Markets in Zero Risk Mode display a live animated counter: "Yield accruing: 0.42 MUSD ↑" in teal, updating every 30 seconds. This counter is the most prominent UI element on the market detail screen for Zero Risk markets — it makes principal safety palpable and removes anxiety from participation.

---

### User Journey

**New User Onboarding:**
1. Receive group invite link (e.g., via WhatsApp) → Land on Presight group page
2. Tap "Join with Bitcoin wallet" → Mezo Passport connects in one tap
3. If MUSD balance is zero: prompted to "Mint MUSD from your BTC" → redirected to Mezo CDP flow → returns with MUSD balance
4. Set Prediction Mandate: "Allow Presight to stake up to [X] MUSD per market" — framed as a spending limit, not a smart contract approval
5. Choose default risk preference (can change per market): Zero Risk / Full Stake
6. Redirected to group — ready to predict

**Zero Risk Prediction Flow:**
1. Open group → Browse active markets → See "ZERO RISK" badge on eligible markets
2. Tap market → See: question, current YES/NO split, resolver identity, "Your yield accruing: 0.42 MUSD ↑"
3. Tap "Back YES" or "Back NO" → Confirmation shows: "You are staking 0.42 MUSD of yield — your 500 MUSD principal is safe"
4. Confirm → Transaction executes gaslessly via Passport mandate; position appears in live feed
5. On resolution: if correct, receive proportional share of losers' yield pool in MUSD (minus 1% fee)

**Full Stake Prediction Flow:**
1. Open group → Browse active markets → See "FULL STAKE" badge
2. Tap market → Enter stake amount (pre-filled with mandate default)
3. Tap "Back YES" or "Back NO" → Confirm stake → Gasless execution via Passport mandate
4. Position visible in live feed with staked amount

**Trusted Resolver Assignment Flow:**
1. Market creator selects "Assign resolver" → Searches group member list or pastes wallet address
2. Resolver receives in-app notification: "You've been assigned as resolver for [Market Name] in [Group]"
3. After market deadline: resolver sees "Resolve Market" prompt → selects YES or NO → confirms on-chain
4. Smart contract auto-distributes MUSD; all participants notified instantly

---

### Usability Testing

- Conduct internal walkthroughs with 2 non-crypto team members (Maya persona) — measure time from invite link to first stake; target under 3 minutes
- Validate Zero Risk Mode counter is immediately understood without explanation — test with: "Is your initial Bitcoin at risk?" — target 100% correct comprehension
- Test Trusted Resolver assignment flow on mobile — verify it is clear that the resolver is different from the group admin
- Verify full reward distribution appears in wallets within 30 seconds of resolver confirmation

---

### Accessibility

- All text meets WCAG 2.1 AA contrast ratios — critical on dark mode primary interface
- Risk mode badges (ZERO RISK / FULL STAKE) use both color and text labels — never color alone
- YES/NO buttons are labeled with text, color, and distinct icons — three independent signals for accessibility
- Stake amount input uses large touch targets (minimum 44px) with clear MUSD currency label
- All status notifications have both visual (toast) and text-based confirmation

---

### Feedback Loops

- Post-resolution: one-tap "How was this market? 👍 👎" feedback prompt
- Shareable result card on resolution: "Called it. BTC above $120K. Won 14.3 MUSD on Presight." — shareable to X/Twitter and Telegram with embedded group invite link
- Win streak notification: "3 correct calls in a row — your Conviction Score is rising 🔥"
- Constructive loss notification: "Your yield stake didn't win this one — your 500 MUSD BTC position is untouched. Yield is already accruing for the next market."

---

## Milestones

### Development Phases

| Phase | Tasks | Duration |
|---|---|---|
| **Week 1** | Deploy `PredictionMarket.sol` (escrow, Full Stake Mode, 1% fee routing, auto-distribution) and `GroupRegistry.sol` on Mezo Testnet; Mezo Passport mandate integration spike; MUSD ERC-20 staking and distribution tested end-to-end with 2 wallets | Days 1–7 |
| **Week 2** | Frontend core: group creation, shareable invite link, market creation (Full Stake), YES/NO voting, Passport mandate setup flow, live YES/NO stake bar, market card with resolver identity display | Days 8–14 |
| **Week 3** | Zero Risk Mode (simulated yield counter, mode-specific UI treatment), Trusted Resolver assignment and resolution flow, real-time WebSocket stake feed, prediction history and Conviction Score, mobile optimization | Days 15–21 |
| **Week 4** | End-to-end testing (5 full cycles, 2 wallets, both modes), group leaderboard, demo script and dry run, fallback video recording, submission packaging | Days 22–28 |

---

### Critical Path

Smart contract deployment and Mezo Passport mandate integration (Week 1) are the sole blocking dependencies. Frontend (Week 2) and advanced features (Week 3) run in parallel once contracts are live. Recommended split for 2–3 engineers: one owns smart contracts and Passport integration throughout; one owns frontend from Week 2; one owns Zero Risk Mode, WebSocket layer, and demo prep from Week 3.

---

### Review Points

- **End of Week 1:** Internal demo — MUSD staked via Passport mandate, market resolved by Trusted Resolver, MUSD auto-distributed with 1% fee deducted. Go/no-go gate.
- **End of Week 2:** Full group creation and Full Stake market flow with 2 wallets — UI sign-off.
- **End of Week 3:** Full demo run covering both risk modes, Trusted Resolver flow, and Conviction Score display.
- **End of Week 4:** Final dry run — 5 markets, 2 modes, 2 wallets, full cycle. Testnet stability confirmed.

---

### Launch Plan (Hackathon Submission)

- **Live Demo:** 2 wallets, 1 group, 3 markets — one Zero Risk (yield counter visible), two Full Stake (meaningful MUSD pool). Create → stake → Trusted Resolver resolves → MUSD auto-distributes. Target: under 5 minutes.
- **Pitch Narrative:** "Polymarket made predictions mainstream. Predictly proved social groups want this. Presight makes it Bitcoin-native. Every stake is MUSD. Every win is yours. Every market fee goes to Mezo. No gas. No friction. Just conviction."
- **Testnet Deployment:** Fully live on Mezo Testnet (Chain ID 31611) with public URL
- **Fallback Video:** Pre-recorded 90-second walkthrough of 1 complete Zero Risk Mode cycle as contingency

---

## Technical Requirements

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TailwindCSS, RainbowKit |
| Backend | Node.js, Express.js, WebSocket (ws) |
| Smart Contracts | Solidity, Hardhat, Mezo Testnet (Chain ID 31611) |
| Wallet / Identity | Mezo Passport (mandate-based smart account) |
| Staking Currency | MUSD (ERC-20, Mezo native stablecoin) |
| Real-Time Updates | WebSocket for live stake feed and yield counter |
| Deployment | Vercel (frontend), Railway (backend) |

---

### System Architecture

**Social Layer (Frontend):** Next.js app handles group management, market display, staking UI, and yield counter display. All real-time state (live YES/NO bars, member stakes, yield accrual) is pushed via WebSocket. No blockchain calls from the UI — all transactions route through Mezo Passport.

**Mandate Layer (Mezo Passport):** Users set a one-time Prediction Mandate. All subsequent staking executes gaslessly via the Passport smart account. The backend validates mandate scope before triggering each stake — preventing overspend even if the frontend is compromised.

**Settlement Layer (Smart Contracts on Mezo Testnet):** `PredictionMarket.sol` holds MUSD in escrow. On Trusted Resolver confirmation, the contract: (1) deducts 1% platform fee and routes to Mezo protocol address; (2) calculates each winner's proportional share of the net pool; (3) transfers MUSD directly to winner wallets. `GroupRegistry.sol` manages group membership and resolver assignment. All events are emitted on-chain for full auditability.

---

### Security Measures

- **On-chain escrow only:** MUSD held in `PredictionMarket.sol`, never in a backend wallet or EOA — no custodial risk
- **No private key storage:** All signing occurs client-side via Mezo Passport smart accounts
- **Mandate scope enforcement:** Backend validates every stake against the user's declared mandate before triggering the Passport transaction
- **Reentrancy protection:** `PredictionMarket.sol` uses OpenZeppelin's `ReentrancyGuard` on all MUSD transfer functions
- **Resolver accountability:** Resolver role is assigned per-market and recorded on-chain; resolution events are indexed and permanently auditable
- **Fee immutability:** The 1% protocol fee is hardcoded in the smart contract — it cannot be bypassed by any frontend or backend action

---

### Performance Metrics

| Metric | Target |
|---|---|
| Stake transaction time (via Passport mandate) | ≤3 seconds |
| Frontend load time | ≤2 seconds |
| WebSocket stake update latency | ≤500ms |
| Zero Risk yield counter refresh rate | Every 30 seconds |
| Market resolution + auto-distribution time | ≤30 seconds |
| MUSD reward delivery to winner wallet | Automatic on resolution — 0 clicks |
| Platform fee routing to Mezo protocol | Simultaneous with reward distribution |

---

### Integration Requirements

- **Mezo Passport:** Smart account connection, one-time mandate setup, gasless MUSD staking for all subsequent predictions
- **MUSD Contract (ERC-20):** Transfer into `PredictionMarket.sol` escrow on stake; transfer to winners and protocol fee address on resolution
- **Mezo CDP Contract:** Onboarding flow for users with zero MUSD balance — prompts and redirects to MUSD minting against BTC collateral
- **Mezo Protocol Fee Address:** Hard-coded recipient for 1% MUSD platform fee on every resolved market
- **Mezo Testnet (Chain ID 31611):** All contracts deployed and verified; public RPC endpoint for all reads
- **WebSocket Server:** Real-time push of stake events, yield counter updates, market state changes, and resolution notifications

---

*All projects subject to KYB (Know Your Business) verification for prize distribution as per Mezo Hackathon requirements. All development and testing on Mezo Testnet (Chain ID 31611). MUSD integration via official Mezo CDP and ERC-20 contracts. Mezo Passport mandate implementation follows official Mezo Passport SDK documentation.*

---

## Appendix: Synthesis Notes

### What was taken from Presight
- MUSD as the exclusive staking currency (direct Mezo Integration scoring)
- Mezo Passport mandate-based gasless staking (core UX differentiator)
- Conviction Score leaderboard (social retention mechanic)
- Bitcoin HODLer narrative and persona set

### What was taken from Predictly
- **Trusted Resolver as a distinct, assignable role** (separate from group admin) — more nuanced governance than a simple admin trigger
- **Zero Risk Mode with real-time yield counter** — the live "Your yield so far: X MUSD" display is a specific, well-tested UX from Predictly that makes safety tangible
- **1–3% market fee monetisation model** — adapted to 1% MUSD fee routed to Mezo protocol (aligns commercial success with protocol health)
- **Subscription tier roadmap** — carried forward as a post-hackathon milestone

### What is net new in the combined version
- **1% MUSD fee routed to Mezo protocol on every resolution** — turns Presight activity into direct Mezo protocol revenue; strongly reinforces Mezo Integration scoring
- **Fee immutability at contract level** — the fee cannot be bypassed; builds trust with judges and users
- **Trusted Resolver separate from group admin** — Predictly collapses these; the combined version treats them as distinct roles, which is a cleaner governance model and a more compelling judging story