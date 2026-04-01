import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const deploymentsPath = path.join(__dirname, "../deployments/mezoTestnet.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments/mezoTestnet.json not found. Run deploy.ts first.");
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  // Find the mezoTestnet entry (chainId 31611)
  const entry = Object.values(deployments).find(
    (d: any) => d.chainId === "31611"
  ) as Record<string, string> | undefined;

  if (!entry) {
    throw new Error("No deployment found for chainId 31611 in mezoTestnet.json");
  }

  console.log("Verifying contracts on Mezo Testnet (chain 31611)...\n");

  // 1. MandateValidator (no constructor args)
  console.log("1/3 Verifying MandateValidator at", entry.MandateValidator);
  await run("verify:verify", {
    address: entry.MandateValidator,
    constructorArguments: [],
  });

  // 2. GroupRegistry (no constructor args)
  console.log("\n2/3 Verifying GroupRegistry at", entry.GroupRegistry);
  await run("verify:verify", {
    address: entry.GroupRegistry,
    constructorArguments: [],
  });

  // 3. PredictionMarket (musd, feeAddr, mandateValidator)
  console.log("\n3/3 Verifying PredictionMarket at", entry.PredictionMarket);
  await run("verify:verify", {
    address: entry.PredictionMarket,
    constructorArguments: [
      entry.MUSD,
      entry.protocolFeeAddress,
      entry.MandateValidator,
    ],
  });

  console.log("\n✅ All 3 contracts verified on Mezo Testnet explorer.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
