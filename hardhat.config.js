import { defineConfig } from "hardhat/config";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [hardhatVerify],
  solidity: "0.8.20",
  networks: {
    sepolia: {
      type: "http",
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: {
        mnemonic: process.env.MNEMONIC ?? "",
      },
      chainId: 11155111,
    },
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY ?? "",
    },
  },
});
