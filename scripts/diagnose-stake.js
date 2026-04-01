import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const userAddress = "0xf7E8f9889Ab6B96443cE6acd31B3001B5aD4eCAA";
  const marketAddress = "0xEee0e4b9dAe28Dd47089c8D0f00Aac93a4739292";
  const musdAddress = "0x507Ac33B7B1332b4488AE772fB116cb2E0EA0511";
  const mandateValidatorAddress = "0x99e0dA1A24bD8661C5794Ee1b77b83304A97DdB5";
  const marketId = "0x3c8db12e348bc012384093f1875d217d599cffe4c3f7bd385a0af05da32fad01";

  const musd = await ethers.getContractAt("IERC20", musdAddress);
  const mandateValidator = await ethers.getContractAt("MandateValidator", mandateValidatorAddress);
  const predictionMarket = await ethers.getContractAt("PredictionMarket", marketAddress);

  console.log("--- Diagnostic Check for User:", userAddress, "---");

  // 1. Check MUSD Balance
  const balance = await musd.balanceOf(userAddress);
  console.log("MUSD Balance:", ethers.formatUnits(balance, 18), "mUSD");

  // 2. Check Allowance
  const allowance = await musd.allowance(userAddress, marketAddress);
  console.log("PredictionMarket MUSD Allowance:", ethers.formatUnits(allowance, 18), "mUSD");

  // 4. Check if already staked and what the claim status is
  try {
    const stake = await predictionMarket.stakes(marketId, userAddress);
    console.log("User Stake Amount:", ethers.formatUnits(stake.amount, 18), "mUSD");
    console.log("User Stake side (isYes):", stake.isYes);
    console.log("Already Claimed (via auto-distribute or manual):", stake.claimed);
  } catch (e) {
    console.log("Problem fetching stake status.");
  }

  // 5. Check Market Outcome
  try {
    const market = await predictionMarket.markets(marketId);
    console.log("Market Status (0=Open, 1=Resolved):", market.status.toString());
    console.log("Market Outcome (0=None, 1=Yes, 2=No):", market.outcome.toString());
  } catch (e) {
    console.log("Market not found!");
  }
  console.log("Current Time:", new Date().toLocaleString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
