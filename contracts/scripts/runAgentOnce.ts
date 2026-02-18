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

function trendLabel(trend: number): string {
  if (trend > 0) return "rising";
  if (trend < 0) return "falling";
  return "flat";
}

type AgentState = {
  lastAction: string;
  lastSwitchBlock: number;
  lastRunAt: string;
  lastDecisionId: string;
};

type DecisionHistoryEntry = {
  timestamp: string;
  blockNumber: number;
  action: string;
  executed: boolean;
  activeStrategyBefore: number;
  activeStrategyAfter: number;
  opportunityScore: number;
  riskScoreB: number;
  confidenceScore: number;
  reasonFlags: number;
  txHash: string | null;
  decisionEventTxHash: string | null;
  decisionId: string;
};

const REASON_FLAGS = {
  HIGH_APY_DELTA: 1 << 0,
  LOW_LIQUIDITY_DELTA: 1 << 1,
  HIGH_WITHDRAWAL_FLOW: 1 << 2,
  TREND_RISING: 1 << 3,
  TREND_FALLING: 1 << 4,
  STRATEGY_B_DISABLED: 1 << 5,
  RISK_TOO_HIGH: 1 << 6,
  COOLDOWN_ACTIVE: 1 << 7
} as const;

async function main() {
  const signers = await ethers.getSigners();
  if (!signers.length) {
    throw new Error("No signer found. Set PRIVATE_KEY in contracts/.env (0x-prefixed) and retry.");
  }
  const agent = signers[0];
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const deployFile = path.join(__dirname, "..", "..", "deployments", `${chainId}.json`);

  if (!fs.existsSync(deployFile)) {
    throw new Error(`Missing deployment file: ${deployFile}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deployFile, "utf8"));
  const strategyManager = await ethers.getContractAt("StrategyManager", deployment.strategyManager);
  const vault = await ethers.getContractAt("Vault", deployment.vault);
  const currentBlock = await ethers.provider.getBlockNumber();
  const activeStrategyId = Number(await vault.activeStrategyId());

  const strategyA = parseStrategy(await strategyManager.getStrategy(1));
  const strategyB = parseStrategy(await strategyManager.getStrategy(2));
  const trendB = Number(await strategyManager.getAPYTrend(2));
  const flowWindow = Number(process.env.AGENT_FLOW_WINDOW || 200);
  const cooldownBlocks = Number(process.env.AGENT_COOLDOWN_BLOCKS || 30);
  const netFlowLastN = BigInt(await vault.netFlowLastNBlocks(flowWindow));

  const apyDeltaBps = strategyB.apyBps - strategyA.apyBps;
  const liquidityDeltaBps = strategyB.liquidityBps - strategyA.liquidityBps;
  const opportunityScore = clamp01(apyDeltaBps / 500 + liquidityDeltaBps / 10000);
  const baseRiskScoreB = clamp01(strategyB.utilizationBps / 10000 + (10000 - strategyB.liquidityBps) / 10000);

  const largeWithdrawalThreshold = ethers.parseEther("50");
  const mediumWithdrawalThreshold = ethers.parseEther("15");
  const withdrawalPenalty =
    netFlowLastN < -largeWithdrawalThreshold ? 0.15 : netFlowLastN < -mediumWithdrawalThreshold ? 0.08 : netFlowLastN < 0n ? 0.04 : 0;
  const trendPenalty = trendB < 0 ? 0.06 : 0;
  const trendBonus = trendB > 0 ? 0.05 : 0;
  const riskScoreB = clamp01(baseRiskScoreB + withdrawalPenalty + trendPenalty);
  const confidenceScore = clamp01(0.5 + opportunityScore - riskScoreB + trendBonus);

  const opportunityScoreBps = Math.round(opportunityScore * 10000);
  const riskScoreBps = Math.round(riskScoreB * 10000);

  const stateFile = path.join(__dirname, "..", "..", "deployments", `agent-state-${chainId}.json`);
  let previousState: AgentState | null = null;
  if (fs.existsSync(stateFile)) {
    previousState = JSON.parse(fs.readFileSync(stateFile, "utf8")) as AgentState;
  }
  const inCooldown =
    previousState?.lastSwitchBlock !== undefined &&
    currentBlock - previousState.lastSwitchBlock < cooldownBlocks;

  let action = "HOLD";
  const reasons: string[] = [];
  let reasonFlags = 0;
  let nextStrategyId = activeStrategyId;

  const switchTo2SignalsGood =
    apyDeltaBps >= 180 &&
    strategyB.liquidityBps >= 7000 &&
    riskScoreB <= 0.62 &&
    confidenceScore >= 0.55 &&
    strategyB.enabled;

  const switchBackTo1SignalsBad =
    riskScoreB >= 0.68 ||
    (trendB < 0 && netFlowLastN < -mediumWithdrawalThreshold) ||
    apyDeltaBps < 100 ||
    !strategyB.enabled;

  if (inCooldown) {
    reasons.push(`Cooldown active (${cooldownBlocks} blocks) to avoid thrashing.`);
    reasonFlags |= REASON_FLAGS.COOLDOWN_ACTIVE;
  } else if (activeStrategyId !== 2 && switchTo2SignalsGood) {
    action = "SWITCH_TO_2";
    nextStrategyId = 2;
    reasons.push("Higher APY delta and acceptable liquidity/risk support moving to Strategy 2.");
  } else if (activeStrategyId === 2 && switchBackTo1SignalsBad) {
    action = "SWITCH_TO_1";
    nextStrategyId = 1;
    reasons.push("Risk or adverse flow/trend signal suggests de-risking to Strategy 1.");
  } else {
    reasons.push("Signal set did not cross deterministic action thresholds.");
  }

  if (trendB > 0 && liquidityDeltaBps < 0) {
    reasons.push("APY is rising but liquidity is shrinking -> cautious allocation.");
  }
  if (apyDeltaBps >= 180) reasonFlags |= REASON_FLAGS.HIGH_APY_DELTA;
  if (liquidityDeltaBps < 0) reasonFlags |= REASON_FLAGS.LOW_LIQUIDITY_DELTA;
  if (netFlowLastN < -mediumWithdrawalThreshold) reasonFlags |= REASON_FLAGS.HIGH_WITHDRAWAL_FLOW;
  if (trendB > 0) reasonFlags |= REASON_FLAGS.TREND_RISING;
  if (trendB < 0) reasonFlags |= REASON_FLAGS.TREND_FALLING;
  if (!strategyB.enabled) reasonFlags |= REASON_FLAGS.STRATEGY_B_DISABLED;
  if (riskScoreB > 0.62) reasonFlags |= REASON_FLAGS.RISK_TOO_HIGH;

  const decisionId = ethers.keccak256(
    ethers.toUtf8Bytes(`${chainId}:${currentBlock}:${agent.address}:${action}`)
  );

  let executeTxHash = "";
  let decisionTxHash = "";

  const shouldExecute = action === "SWITCH_TO_1" || action === "SWITCH_TO_2";
  if (shouldExecute) {
    const tx = await vault.setActiveStrategyWithDecision(
      nextStrategyId,
      action,
      opportunityScoreBps,
      riskScoreBps,
      reasonFlags,
      decisionId
    );
    const rcpt = await tx.wait();
    executeTxHash = rcpt?.hash || tx.hash;
    decisionTxHash = executeTxHash;
    console.log(`Executed setActiveStrategy(${nextStrategyId}): ${executeTxHash}`);
  } else {
    const tx = await vault.recordDecision(action, opportunityScoreBps, riskScoreBps, reasonFlags, decisionId);
    const rcpt = await tx.wait();
    decisionTxHash = rcpt?.hash || tx.hash;
    console.log("No strategy switch executed.");
  }

  const log = {
    timestamp: new Date().toISOString(),
    chainId: Number(chainId),
    blockNumber: currentBlock,
    agent: agent.address,
    activeStrategyBefore: activeStrategyId,
    activeStrategyAfter: shouldExecute ? nextStrategyId : activeStrategyId,
    strategyA,
    strategyB,
    trendB: trendLabel(trendB),
    apyDeltaBps,
    liquidityDeltaBps,
    flowWindowBlocks: flowWindow,
    netFlowLastN: netFlowLastN.toString(),
    opportunityScore,
    baseRiskScoreB,
    trendPenalty,
    trendBonus,
    withdrawalPenalty,
    riskScoreB,
    confidenceScore,
    cooldownBlocks,
    inCooldown,
    reasons,
    reasonFlags,
    decisionRule:
      "switch_to_2: apyDelta>=180 && liqB>=7000 && risk<=0.62 && confidence>=0.55; switch_to_1: high risk or negative trend+outflow or weak delta",
    action,
    executed: shouldExecute,
    txHash: executeTxHash || null,
    decisionEventTxHash: decisionTxHash || null,
    decisionId
  };

  const outRoot = path.join(__dirname, "..", "..", "deployments", `decision-log-${chainId}.json`);
  const outApp = path.join(__dirname, "..", "..", "app", "public", "deployments", `decision-log-${chainId}.json`);
  fs.writeFileSync(outRoot, JSON.stringify(log, null, 2));
  fs.writeFileSync(outApp, JSON.stringify(log, null, 2));

  const historyRoot = path.join(__dirname, "..", "..", "deployments", `decision-history-${chainId}.json`);
  const historyApp = path.join(__dirname, "..", "..", "app", "public", "deployments", `decision-history-${chainId}.json`);
  const entry: DecisionHistoryEntry = {
    timestamp: log.timestamp,
    blockNumber: log.blockNumber,
    action: log.action,
    executed: log.executed,
    activeStrategyBefore: log.activeStrategyBefore,
    activeStrategyAfter: log.activeStrategyAfter,
    opportunityScore: log.opportunityScore,
    riskScoreB: log.riskScoreB,
    confidenceScore: log.confidenceScore,
    reasonFlags: log.reasonFlags,
    txHash: log.txHash,
    decisionEventTxHash: log.decisionEventTxHash,
    decisionId: log.decisionId
  };
  let history: DecisionHistoryEntry[] = [];
  if (fs.existsSync(historyRoot)) {
    history = JSON.parse(fs.readFileSync(historyRoot, "utf8")) as DecisionHistoryEntry[];
  }
  history.push(entry);
  if (history.length > 50) {
    history = history.slice(history.length - 50);
  }
  fs.writeFileSync(historyRoot, JSON.stringify(history, null, 2));
  fs.writeFileSync(historyApp, JSON.stringify(history, null, 2));

  if (shouldExecute) {
    const state: AgentState = {
      lastAction: action,
      lastSwitchBlock: currentBlock,
      lastRunAt: new Date().toISOString(),
      lastDecisionId: decisionId
    };
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  }

  console.log(`Decision log written: ${outRoot}`);
  console.log(log);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
