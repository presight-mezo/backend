import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Mock MUSD with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy Mock MUSD
  console.log("\nDeploying Mock MUSD...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  // Deploy with 1,000,000 mUSD initial supply to the deployer
  const initialSupply = ethers.parseEther("1000000");
  const musd = await MockERC20.deploy("Mezo USD", "mUSD", initialSupply);
  
  await musd.waitForDeployment();
  const musdAddress = await musd.getAddress();
  console.log("✅ Mock MUSD deployed at:", musdAddress);

  // 2. Update .env file
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    
    // Replace MUSD_ADDRESS line
    const musdRegex = /^MUSD_ADDRESS=.*$/m;
    if (musdRegex.test(envContent)) {
      envContent = envContent.replace(musdRegex, `MUSD_ADDRESS=${musdAddress}`);
    } else {
      envContent += `\nMUSD_ADDRESS=${musdAddress}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env with new MUSD_ADDRESS.");
  }

  // 3. Update deployments/mezoTestnet.json
  const deploymentsPath = path.join(__dirname, "../deployments/mezoTestnet.json");
  if (fs.existsSync(deploymentsPath)) {
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
    const network = await ethers.provider.getNetwork();
    const chainKey = `chain_${network.chainId}`;
    
    if (deployments[chainKey]) {
      deployments[chainKey].MUSD = musdAddress;
      fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
      console.log("✅ Updated deployments/mezoTestnet.json with new MUSD address.");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
