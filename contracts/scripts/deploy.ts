import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = network.config.chainId?.toString() || (await ethers.provider.getNetwork()).chainId.toString();

  console.log(`Deploying to ${network.name} (chainId ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const erc20 = await ERC20Mock.deploy();
  await erc20.waitForDeployment();

  const YieldOracleMock = await ethers.getContractFactory("YieldOracleMock");
  const oracle = await YieldOracleMock.deploy();
  await oracle.waitForDeployment();

  const StrategyManager = await ethers.getContractFactory("StrategyManager");
  const strategyManager = await StrategyManager.deploy();
  await strategyManager.waitForDeployment();

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(await erc20.getAddress(), await oracle.getAddress());
  await vault.waitForDeployment();

  const setApyTx = await oracle.setAPYBps(450);
  await setApyTx.wait();

  const mintAmount = ethers.parseEther("10000");
  const mintTx = await erc20.mint(deployer.address, mintAmount);
  await mintTx.wait();

  // Strategy A: safer baseline
  const setStratATx = await strategyManager.setStrategy(1, "Strategy A", 420, 9000, 3000, true);
  await setStratATx.wait();
  // Strategy B: higher APY candidate used by deterministic agent check
  const setStratBTx = await strategyManager.setStrategy(2, "Strategy B", 650, 8000, 3500, true);
  await setStratBTx.wait();

  const setActiveTx = await vault.setActiveStrategy(1);
  await setActiveTx.wait();

  const output = {
    chainId: Number(chainId),
    erc20: await erc20.getAddress(),
    vault: await vault.getAddress(),
    yieldOracle: await oracle.getAddress(),
    strategyManager: await strategyManager.getAddress(),
    deployer: deployer.address
  };

  const rootDeployDir = path.join(__dirname, "..", "..", "deployments");
  const appDeployDir = path.join(__dirname, "..", "..", "app", "public", "deployments");
  fs.mkdirSync(rootDeployDir, { recursive: true });
  fs.mkdirSync(appDeployDir, { recursive: true });

  const rootFile = path.join(rootDeployDir, `${chainId}.json`);
  const appFile = path.join(appDeployDir, `${chainId}.json`);

  fs.writeFileSync(rootFile, JSON.stringify(output, null, 2));
  fs.writeFileSync(appFile, JSON.stringify(output, null, 2));

  console.log("Deployment written:");
  console.log(`- ${rootFile}`);
  console.log(`- ${appFile}`);
  console.log(output);

  console.log("\nProof Tx instruction:");
  console.log(`cd contracts && npx hardhat run scripts/proofTx.ts --network ${network.name}`);
  console.log("This will approve+deposit 1 mUSDC and write deployments/proof-<chainId>.json");
  console.log(`Agent instruction: npx hardhat run scripts/runAgentOnce.ts --network ${network.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
