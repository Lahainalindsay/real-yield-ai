import { ethers } from "ethers";

export const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

export const vaultAbi = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function setActiveStrategy(uint256 strategyId) external",
  "function balanceOf(address user) external view returns (uint256)",
  "function totalAssets() external view returns (uint256)",
  "function currentAPYBps() external view returns (uint256)",
  "function activeStrategyId() external view returns (uint256)"
];

export const oracleAbi = ["function currentAPYBps() external view returns (uint256)"];
export const strategyManagerAbi = [
  "function getStrategy(uint256 id) external view returns (tuple(string name, uint256 apyBps, uint256 liquidityBps, uint256 utilizationBps, bool enabled))",
  "function getAPYTrend(uint256 id) external view returns (int8)"
];

export type Deployment = {
  chainId: number;
  erc20: string;
  vault: string;
  yieldOracle: string;
  strategyManager: string;
};

const envDeployment: Deployment = {
  chainId: Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 97),
  erc20: process.env.NEXT_PUBLIC_ERC20_ADDRESS || "",
  vault: process.env.NEXT_PUBLIC_VAULT_ADDRESS || "",
  yieldOracle: process.env.NEXT_PUBLIC_YIELD_ORACLE_ADDRESS || "",
  strategyManager: process.env.NEXT_PUBLIC_STRATEGY_MANAGER_ADDRESS || ""
};

export async function resolveDeployment(chainId: number): Promise<Deployment> {
  if (
    envDeployment.erc20 &&
    envDeployment.vault &&
    envDeployment.yieldOracle &&
    envDeployment.strategyManager &&
    envDeployment.chainId === chainId
  ) {
    return envDeployment;
  }

  const res = await fetch(`/deployments/${chainId}.json`);
  if (!res.ok) {
    throw new Error(`Missing deployment for chain ${chainId}. Set env vars or deploy first.`);
  }
  return (await res.json()) as Deployment;
}

export function contractsFromProvider(provider: ethers.providers.Web3Provider, deployment: Deployment) {
  const signer = provider.getSigner();
  return {
    erc20: new ethers.Contract(deployment.erc20, erc20Abi, signer),
    vault: new ethers.Contract(deployment.vault, vaultAbi, signer),
    oracle: new ethers.Contract(deployment.yieldOracle, oracleAbi, signer),
    strategyManager: new ethers.Contract(deployment.strategyManager, strategyManagerAbi, signer)
  };
}
