import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      accounts: privateKey ? [privateKey] : []
    },
    opBnbTestnet: {
      url: process.env.OPBNB_TESTNET_RPC_URL || "https://opbnb-testnet-rpc.bnbchain.org",
      chainId: 5611,
      accounts: privateKey ? [privateKey] : []
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "opBnbTestnet",
        chainId: 5611,
        urls: {
          apiURL: "https://open-platform.nodereal.io/5611b7f6f0f24f2ba6f0d6f6f24f58f6/opbnb-testnet-explorer/api",
          browserURL: "https://testnet.opbnbscan.com"
        }
      }
    ]
  }
};

export default config;
