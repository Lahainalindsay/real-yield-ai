import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

type Strategy = {
  name: string;
  apyBps: number;
  liquidityBps: number;
  utilizationBps: number;
  enabled: boolean;
};

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function parseStrategy(raw: any): Strategy {
  return {
    name: raw.name as string,
    apyBps: Number(raw.apyBps),
    liquidityBps: Number(raw.liquidityBps),
    utilizationBps: Number(raw.utilizationBps),
    enabled: Boolean(raw.enabled)
  };
}

async function main() {
  const [agent] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const deployFile = path.join(__dirname, "..", "..", "deployments", `${chainId}.json`);

  if (!fs.existsSync(deployFile)) {
    throw new Error(`Missing deployment file: ${deployFile}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deployFile, "utf8"));
  const strategyManager = await ethers.getContractAt("StrategyManager", deployment.strategyManager);
  const vault = await ethers.getContractAt("Vault", deployment.vault);

  const strategyA = parseStrategy(await strategyManager.getStrategy(1));
  const strategyB = parseStrategy(await strategyManager.getStrategy(2));

  const apyDeltaBps = strategyB.apyBps - strategyA.apyBps;
  const liquidityDeltaBps = strategyB.liquidityBps - strategyA.liquidityBps;
  const opportunityScore = clamp01(apyDeltaBps / 500 + liquidityDeltaBps / 10000);
  const riskScoreB = clamp01(strategyB.utilizationBps / 10000 + (10000 - strategyB.liquidityBps) / 10000);

  const shouldExecute =
    apyDeltaBps >= 200 &&
    strategyB.liquidityBps >= 7000 &&
    riskScoreB <= 0.6 &&
    strategyB.enabled;

  let executeTxHash = "";
  if (shouldExecute) {
    const tx = await vault.setActiveStrategy(2);
    const rcpt = await tx.wait();
    executeTxHash = rcpt?.hash || tx.hash;
    console.log(`Executed setActiveStrategy(2): ${executeTxHash}`);
  } else {
    console.log("No strategy switch executed.");
  }

  const log = {
    timestamp: new Date().toISOString(),
    chainId: Number(chainId),
    agent: agent.address,
    strategyA,
    strategyB,
    apyDeltaBps,
    liquidityDeltaBps,
    opportunityScore,
    riskScoreB,
    decisionRule:
      "if (apyDeltaBps >= 200) && (liquidityBps_B >= 7000) && (riskScore_B <= 0.6) then setActiveStrategy(2)",
    executed: shouldExecute,
    txHash: executeTxHash || null
  };

  const outRoot = path.join(__dirname, "..", "..", "deployments", `decision-log-${chainId}.json`);
  const outApp = path.join(__dirname, "..", "..", "app", "public", "deployments", `decision-log-${chainId}.json`);
  fs.writeFileSync(outRoot, JSON.stringify(log, null, 2));
  fs.writeFileSync(outApp, JSON.stringify(log, null, 2));

  console.log(`Decision log written: ${outRoot}`);
  console.log(log);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
