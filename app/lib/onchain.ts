import { ethers } from "ethers";
import { contractsFromProvider, resolveDeployment } from "./contracts";

export async function readSnapshot(provider: ethers.providers.Web3Provider, address: string, chainId: number) {
  const deployment = await resolveDeployment(chainId);
  const { erc20, vault, oracle, strategyManager } = contractsFromProvider(provider, deployment);

  const [tokenBal, userVaultBal, totalAssets, apyBps, activeStrategyId, strategyA, strategyB, trendB] = await Promise.all([
    erc20.balanceOf(address),
    vault.balanceOf(address),
    vault.totalAssets(),
    oracle.currentAPYBps(),
    vault.activeStrategyId(),
    strategyManager.getStrategy(1),
    strategyManager.getStrategy(2),
    strategyManager.getAPYTrend(2)
  ]);

  return {
    deployment,
    musdcBalance: Number(ethers.utils.formatUnits(tokenBal, 18)).toFixed(4),
    vaultBalance: Number(ethers.utils.formatUnits(userVaultBal, 18)).toFixed(4),
    totalAssets: Number(ethers.utils.formatUnits(totalAssets, 18)).toFixed(4),
    apy: (Number(apyBps) / 100).toFixed(2),
    activeStrategyId: Number(activeStrategyId),
    strategyA: {
      name: strategyA.name as string,
      apyBps: Number(strategyA.apyBps),
      liquidityBps: Number(strategyA.liquidityBps),
      utilizationBps: Number(strategyA.utilizationBps),
      enabled: Boolean(strategyA.enabled)
    },
    strategyB: {
      name: strategyB.name as string,
      apyBps: Number(strategyB.apyBps),
      liquidityBps: Number(strategyB.liquidityBps),
      utilizationBps: Number(strategyB.utilizationBps),
      enabled: Boolean(strategyB.enabled)
    },
    trendB: Number(trendB),
    trendBLabel: Number(trendB) > 0 ? "rising" : Number(trendB) < 0 ? "falling" : "flat"
  };
}
