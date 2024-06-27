import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.BLOCKHAIN_RPC,
      accounts: [`0x${process.env.WALLET_PRIVKEY}`]
    },
    degen: {
      url: "http://degen-node-url:8545",  // Replace with your node's URL
      accounts: [`0x${process.env.WALLET_PRIVKEY}`]
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [`0x${process.env.WALLET_PRIVKEY}`]
    },
    bsc_mainnet: {
      url: "https://bsc-dataseed.bnbchain.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [`0x${process.env.WALLET_PRIVKEY}`]
    }
  }
};

export default config;
