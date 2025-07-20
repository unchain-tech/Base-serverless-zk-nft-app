import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const {
  PRIVATE_KEY,
  GAS_REPORT,
  COINMARKETCAP_API_KEY,
  BASESCAN_API_KEY
} = process.env

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    baseSepolia: {
      url: 'https://sepolia.base.org',
      chainId: 84532,
      accounts: [`${PRIVATE_KEY}`]
    },
  },
  gasReporter: {
    enabled: GAS_REPORT ? true : false,
    currency: 'JPY',
    gasPrice: 20,
    token: 'ETH',
    coinmarketcap: COINMARKETCAP_API_KEY,
    gasPriceApi: 'https://api.etherscan.io/api?module=proxy&action=eth_gasPrice',
  },
  etherscan: {
    apiKey: {
      baseSepolia: BASESCAN_API_KEY!
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  }
};

export default config;