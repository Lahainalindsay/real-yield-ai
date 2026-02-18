import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const signers = await ethers.getSigners();
  if (!signers.length) {
    throw new Error("No signer found. Set PRIVATE_KEY in contracts/.env (0x-prefixed) and retry.");
  }
  const signer = signers[0];
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();

  const to = process.env.SEED_TO;
  const amount = process.env.SEED_AMOUNT || "1000";

  if (!to) {
    throw new Error("SEED_TO is required in .env");
  }

  const deploymentFile = path.join(__dirname, "..", "..", "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Missing deployment file: ${deploymentFile}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const erc20 = await ethers.getContractAt("ERC20Mock", deployment.erc20);

  const tx = await erc20.mint(to, ethers.parseEther(amount));
  const rcpt = await tx.wait();

  console.log(`Minted ${amount} mUSDC to ${to}`);
  console.log(`tx: ${rcpt?.hash || tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
