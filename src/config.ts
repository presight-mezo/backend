import * as dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

// ── Network ──────────────────────────────────────────────────────────────────

export const MEZO_RPC_URL         = requireEnv("MEZO_RPC_URL");
export const MEZO_CHAIN_ID        = 31611;
export const MUSD_ADDRESS         = requireEnv("MUSD_ADDRESS");
export const MEZO_PROTOCOL_FEE_ADDRESS = requireEnv("MEZO_PROTOCOL_FEE_ADDRESS");

// ── Deployed Contracts ────────────────────────────────────────────────────────

export const CONTRACTS = {
  PredictionMarket: requireEnv("PREDICTION_MARKET_ADDRESS"),
  GroupRegistry:    requireEnv("GROUP_REGISTRY_ADDRESS"),
  MandateValidator: requireEnv("MANDATE_VALIDATOR_ADDRESS"),
} as const;

// ── Ethers Provider + Deployer Signer ─────────────────────────────────────────

export const provider = new ethers.JsonRpcProvider(MEZO_RPC_URL, {
  chainId: MEZO_CHAIN_ID,
  name: "mezoTestnet",
});

const DEPLOYER_PRIVATE_KEY = requireEnv("DEPLOYER_PRIVATE_KEY");
export const deployerSigner = new ethers.Wallet(
  DEPLOYER_PRIVATE_KEY.startsWith("0x")
    ? DEPLOYER_PRIVATE_KEY
    : `0x${DEPLOYER_PRIVATE_KEY}`,
  provider
);

// ── Server Config ─────────────────────────────────────────────────────────────

export const PORT        = parseInt(process.env.PORT ?? "3001", 10);
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
export const SIWE_DOMAIN = process.env.SIWE_DOMAIN ?? "localhost:3000";

// ── ABIs (minimal — functions we call server-side) ───────────────────────────

export const PREDICTION_MARKET_ABI = [
  "function createMarket(bytes32 groupId, string question, uint256 deadline, address resolver, uint8 mode) returns (bytes32)",
  "function stake(bytes32 marketId, bool direction, uint256 amount)",
  "function resolve(bytes32 marketId, bool outcome)",
  "function claimReward(bytes32 marketId)",
  "function getMarket(bytes32 marketId) view returns (bytes32, bytes32, string, uint256, address, uint8, uint8, uint8, uint256, uint256, uint256)",
  "event MarketCreated(bytes32 indexed marketId, bytes32 indexed groupId, string question, address resolver, uint8 mode, uint256 deadline)",
  "event StakePlaced(bytes32 indexed marketId, address indexed staker, bool direction, uint256 amount)",
  "event MarketResolved(bytes32 indexed marketId, bool outcome, uint256 totalPool, uint256 feeAmount)",
  "event RewardsDistributed(bytes32 indexed marketId, uint256 winnerCount, uint256 netPool)",
] as const;

export const MANDATE_VALIDATOR_ABI = [
  "function registerMandate(address user, uint256 limitPerMarket)",
  "function revokeMandate()",
  "function validateMandate(address user, uint256 amount, bytes32 marketId) view returns (bool valid, string reason)",
  "function getMandate(address user) view returns (uint256 limitPerMarket, bool active)",
  "function hasStaked(address user, bytes32 marketId) view returns (bool)",
  "event MandateRegistered(address indexed user, uint256 limitPerMarket)",
] as const;

export const GROUP_REGISTRY_ABI = [
  "function createGroup(string name) returns (bytes32)",
  "function joinGroup(bytes32 groupId)",
  "function assignResolver(bytes32 groupId, bytes32 marketId, address resolver)",
  "function isGroupMember(bytes32 groupId, address member) view returns (bool)",
  "function getResolver(bytes32 marketId) view returns (address)",
  "function getGroup(bytes32 groupId) view returns (bytes32, address, string, bool)",
  "event GroupCreated(bytes32 indexed groupId, address indexed admin, string name)",
  "event MemberJoined(bytes32 indexed groupId, address indexed member)",
  "event ResolverAssigned(bytes32 indexed marketId, address indexed resolver, bytes32 indexed groupId)",
] as const;

export const MUSD_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
] as const;

// ── Contract Instances ────────────────────────────────────────────────────────

export const predictionMarket = new ethers.Contract(
  CONTRACTS.PredictionMarket, PREDICTION_MARKET_ABI, deployerSigner
);

export const mandateValidator = new ethers.Contract(
  CONTRACTS.MandateValidator, MANDATE_VALIDATOR_ABI, deployerSigner
);

export const groupRegistry = new ethers.Contract(
  CONTRACTS.GroupRegistry, GROUP_REGISTRY_ABI, deployerSigner
);

export const musd = new ethers.Contract(
  MUSD_ADDRESS, MUSD_ABI, deployerSigner
);
