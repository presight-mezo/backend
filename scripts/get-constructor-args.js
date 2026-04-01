import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const initialSupply = ethers.parseEther("1000000");
  const name = "Mezo USD";
  const symbol = "mUSD";
  
  const fragment = MockERC20.interface.deploy;
  const encoded = MockERC20.interface.encodeDeploy([name, symbol, initialSupply]);
  
  // The constructor arguments are the logic *after* the bytecode.
  // In Hardhat verify, it usually just wants the arguments themselves.
  console.log("Encoded Constructor Arguments:");
  console.log(encoded.slice(2)); // Remove '0x'
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
