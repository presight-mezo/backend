import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "| Chain ID:", network.chainId.toString());

  // 1. Deploy MandateValidator
  console.log("\n1/4 Deploying MandateValidator...");
  const MandateValidator = await ethers.getContractFactory("MandateValidator");
  const mandateValidator = await MandateValidator.deploy();
  await mandateValidator.waitForDeployment();
  const mandateValidatorAddress = await mandateValidator.getAddress();
  console.log("   MandateValidator deployed at:", mandateValidatorAddress);

  // 2. Deploy GroupRegistry
  console.log("\n2/4 Deploying GroupRegistry...");
  const GroupRegistry = await ethers.getContractFactory("GroupRegistry");
  const groupRegistry = await GroupRegistry.deploy();
  await groupRegistry.waitForDeployment();
  const groupRegistryAddress = await groupRegistry.getAddress();
  console.log("   GroupRegistry deployed at:", groupRegistryAddress);

  // 3. Deploy PredictionMarket
  const musdAddress        = process.env.MUSD_ADDRESS;
  const protocolFeeAddress = process.env.MEZO_PROTOCOL_FEE_ADDRESS;

  if (!musdAddress || !protocolFeeAddress) {
    throw new Error(
      "Missing env vars: MUSD_ADDRESS and MEZO_PROTOCOL_FEE_ADDRESS must be set before deploying PredictionMarket."
    );
  }

  console.log("\n3/4 Deploying PredictionMarket...");
  console.log("   MUSD address:         ", musdAddress);
  console.log("   Protocol fee address: ", protocolFeeAddress);
  console.log("   MandateValidator:     ", mandateValidatorAddress);

  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(
    musdAddress,
    protocolFeeAddress,
    mandateValidatorAddress
  );
  await predictionMarket.waitForDeployment();
  const predictionMarketAddress = await predictionMarket.getAddress();
  console.log("   PredictionMarket deployed at:", predictionMarketAddress);

  // 4. Wire: setPredictionMarket on MandateValidator
  console.log("\n4/4 Wiring PredictionMarket → MandateValidator...");
  const setTx = await mandateValidator.setPredictionMarket(predictionMarketAddress);
  await setTx.wait();
  console.log("   Done. predictionMarket set in MandateValidator.");

  // 5. Save deployment addresses
  const deployments = {};
  const deploymentsPath = path.join(__dirname, "../deployments/mezoTestnet.json");
  if (fs.existsSync(deploymentsPath)) {
    Object.assign(deployments, JSON.parse(fs.readFileSync(deploymentsPath, "utf8")));
  }

  const chainKey = `chain_${network.chainId}`;
  deployments[chainKey] = {
    network:               network.name,
    chainId:               network.chainId.toString(),
    deployedAt:            new Date().toISOString(),
    deployer:              deployer.address,
    MandateValidator:      mandateValidatorAddress,
    GroupRegistry:         groupRegistryAddress,
    PredictionMarket:      predictionMarketAddress,
    MUSD:                  musdAddress,
    protocolFeeAddress:    protocolFeeAddress,
  };

  fs.mkdirSync(path.dirname(deploymentsPath), { recursive: true });
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("\n✅ Deployment complete! Addresses saved to deployments/mezoTestnet.json");
  console.log(JSON.stringify(deployments[chainKey], null, 2));

  // 6. Print env vars for manual update
  console.log("\n── Copy these to .env ────────────────────────────────────────");
  console.log(`MANDATE_VALIDATOR_ADDRESS=${mandateValidatorAddress}`);
  console.log(`GROUP_REGISTRY_ADDRESS=${groupRegistryAddress}`);
  console.log(`PREDICTION_MARKET_ADDRESS=${predictionMarketAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
