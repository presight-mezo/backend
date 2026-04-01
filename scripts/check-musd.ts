import * as dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

const p = new ethers.JsonRpcProvider(process.env.MEZO_RPC_URL, { chainId: 31611, name: "mezoTestnet" });

const abi = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function mint(address,uint256)",
  "function owner() view returns (address)",
];

const musd = new ethers.Contract(process.env.MUSD_ADDRESS!, abi, p);

async function main() {
  const [bal, sym, dec, total] = await Promise.all([
    musd.balanceOf("0xf7E8f9889Ab6B96443cE6acd31B3001B5aD4eCAA"),
    musd.symbol(),
    musd.decimals(),
    musd.totalSupply(),
  ]);
  console.log("Symbol:", sym, "Decimals:", dec);
  console.log("Deployer MUSD:", ethers.formatEther(bal));
  console.log("Total Supply:", ethers.formatEther(total));

  // Try to call owner (to see if it has one)
  try {
    const owner = await musd.owner();
    console.log("Owner:", owner);
  } catch {
    console.log("No owner() function");
  }
}

main().catch(console.error);
