import dotenv from "dotenv";
import { ethers } from "ethers";
import { createRequire } from "module";

dotenv.config();

const require = createRequire(import.meta.url);
const PosterArtifact = require("../build/contracts/Poster.json");

const RPC_URL = process.env.RPC_URL;
const MNEMONIC = process.env.MNEMONIC;

// адрес задеплоенного Poster (из truffle migrate)
const POSTER_ADDRESS = "0x5E5556D9dbf13FcaA2Dd97703D58824805551056";

// адрес верифицированного HELLO-токена из ЛР3 на Sepolia
const HELLO_TOKEN_ADDRESS = "0xF2d2fd6833499b991Fb401f73B771Cdd4D7F85b8";

async function main() {
  if (!RPC_URL || !MNEMONIC) {
    throw new Error("RPC_URL or MNEMONIC not set in .env");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = ethers.Wallet.fromPhrase(MNEMONIC).connect(provider);

  console.log("Using account:", await wallet.getAddress());

  const poster = new ethers.Contract(
    POSTER_ADDRESS,
    PosterArtifact.abi,
    wallet
  );

  console.log("Current tokenAddress:", await poster.tokenAddress());
  console.log("Current threshold:", (await poster.threshold()).toString());

  // 1) Привязываем HELLO-токен
  console.log("Setting tokenAddress to HELLO token:", HELLO_TOKEN_ADDRESS);
  const tx1 = await poster.setTokenAddress(HELLO_TOKEN_ADDRESS);
  console.log("setTokenAddress tx hash:", tx1.hash);
  await tx1.wait();
  console.log("New tokenAddress:", await poster.tokenAddress());

  // 2) Устанавливаем порог в 10 токенов (при 18 decimals)
  const threshold = ethers.parseUnits("10", 18); // 10 * 10^18
  console.log("Setting threshold to 10 tokens:", threshold.toString());
  const tx2 = await poster.setThreshold(threshold);
  console.log("setThreshold tx hash:", tx2.hash);
  await tx2.wait();
  console.log("New threshold:", (await poster.threshold()).toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
