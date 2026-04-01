require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";
const MEZO_RPC_URL = process.env.MEZO_RPC_URL ?? "https://rpc.test.mezo.org";
const MEZO_EXPLORER_API_KEY = process.env.MEZO_EXPLORER_API_KEY ?? "placeholder";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    mezoTestnet: {
      url: MEZO_RPC_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 31611,
    },
  },
  etherscan: {
    apiKey: {
      mezoTestnet: MEZO_EXPLORER_API_KEY,
    },
    customChains: [
      {
        network: "mezoTestnet",
        chainId: 31611,
        urls: {
          apiURL: "https://explorer.test.mezo.org/api",
          browserURL: "https://explorer.test.mezo.org",
        },
      },
    ],
  },
  tsnode: {
    esm: true,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
