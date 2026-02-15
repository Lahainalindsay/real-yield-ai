import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [signer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();

  const deploymentFile = path.join(__dirname, "..", "..", "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Missing deployment file: ${deploymentFile}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const erc20 = await ethers.getContractAt("ERC20Mock", deployment.erc20);
  const vault = await ethers.getContractAt("Vault", deployment.vault);

  const amount = ethers.parseEther("1");

  const approveTx = await erc20.approve(deployment.vault, amount);
  const approveRcpt = await approveTx.wait();

  const depositTx = await vault.deposit(amount);
  const depositRcpt = await depositTx.wait();

  const proof = {
    chainId: Number(chainId),
    user: signer.address,
    approveTxHash: approveRcpt?.hash || approveTx.hash,
    depositTxHash: depositRcpt?.hash || depositTx.hash,
    amount: "1.0 mUSDC",
    vault: deployment.vault,
    erc20: deployment.erc20,
    timestamp: new Date().toISOString()
  };

  const outputFile = path.join(__dirname, "..", "..", "deployments", `proof-${chainId}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(proof, null, 2));

  console.log("Proof tx complete:");
  console.log(proof);
  console.log(`Written: ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
