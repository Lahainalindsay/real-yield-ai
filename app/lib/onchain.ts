import { ethers } from "ethers";
import { contractsFromProvider, resolveDeployment } from "./contracts";

export async function readSnapshot(provider: ethers.providers.Web3Provider, address: string, chainId: number) {
  const deployment = await resolveDeployment(chainId);
  const { erc20, vault, oracle } = contractsFromProvider(provider, deployment);

  const [tokenBal, userVaultBal, totalAssets, apyBps] = await Promise.all([
    erc20.balanceOf(address),
    vault.balanceOf(address),
    vault.totalAssets(),
    oracle.currentAPYBps()
  ]);

  return {
    deployment,
    musdcBalance: Number(ethers.utils.formatUnits(tokenBal, 18)).toFixed(4),
    vaultBalance: Number(ethers.utils.formatUnits(userVaultBal, 18)).toFixed(4),
    totalAssets: Number(ethers.utils.formatUnits(totalAssets, 18)).toFixed(4),
    apy: (Number(apyBps) / 100).toFixed(2)
  };
}
