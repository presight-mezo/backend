import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Sandbox Environment with:", deployer.address);

  const FEE_ADDR = "0x53A4441309d747DC378d001fD92a2a949d84BB49"; // Mezo Protocol Fee Addr

  // 1. Deploy Sandbox MUSD
  const MockMUSD = await ethers.getContractFactory("MockERC20");
  const musd = await MockMUSD.deploy("Sandbox MUSD", "sMUSD", ethers.parseEther("1000000000"));
  await musd.waitForDeployment();
  const musdAddr = await musd.getAddress();
  console.log("✅ Sandbox MUSD deployed to:", musdAddr);

  // 2. Deploy MandateValidator
  const MandateValidator = await ethers.getContractFactory("MandateValidator");
  const mv = await MandateValidator.deploy();
  await mv.waitForDeployment();
  const mvAddr = await mv.getAddress();
  console.log("✅ MandateValidator deployed to:", mvAddr);

  // 3. Deploy PredictionMarket
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const pm = await PredictionMarket.deploy(musdAddr, FEE_ADDR, mvAddr);
  await pm.waitForDeployment();
  const pmAddr = await pm.getAddress();
  console.log("✅ PredictionMarket deployed to:", pmAddr);

  // 4. Wire PM -> MV
  await (await (mv as any).setPredictionMarket(pmAddr)).wait();
  console.log("✅ MandateValidator wired to PredictionMarket");

  // 5. Deploy GroupRegistry
  const GroupRegistry = await ethers.getContractFactory("GroupRegistry");
  const gr = await GroupRegistry.deploy();
  await gr.waitForDeployment();
  const grAddr = await gr.getAddress();
  console.log("✅ GroupRegistry deployed to:", grAddr);

  // Save to sandbox sidecar
  const sandbox = {
    network: "mezoTestnet",
    chainId: 31611,
    deployedAt: new Date().toISOString(),
    addresses: {
      MUSD: musdAddr,
      MandateValidator: mvAddr,
      PredictionMarket: pmAddr,
      GroupRegistry: grAddr,
      protocolFeeAddress: FEE_ADDR,
    }
  };

  const outputPath = path.join(__dirname, "../deployments/sandbox.json");
  fs.writeFileSync(outputPath, JSON.stringify(sandbox, null, 2));
  console.log("✅ Sandbox addresses saved to deployments/sandbox.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
