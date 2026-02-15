import { ethers, run } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const deploymentFile = path.join(__dirname, "..", "..", "deployments", `${chainId}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Missing deployment file: ${deploymentFile}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  await run("verify:verify", {
    address: deployment.erc20,
    constructorArguments: []
  });

  await run("verify:verify", {
    address: deployment.yieldOracle,
    constructorArguments: []
  });

  await run("verify:verify", {
    address: deployment.vault,
    constructorArguments: [deployment.erc20, deployment.yieldOracle]
  });

  console.log("Verification submitted.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
