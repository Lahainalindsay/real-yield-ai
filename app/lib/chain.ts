import { ethers } from "ethers";

export const CHAINS = {
  97: {
    chainIdHex: ethers.utils.hexValue(97),
    chainName: "BSC Testnet",
    rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
    blockExplorerUrls: ["https://testnet.bscscan.com"],
    nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 }
  },
  5611: {
    chainIdHex: ethers.utils.hexValue(5611),
    chainName: "opBNB Testnet",
    rpcUrls: ["https://opbnb-testnet-rpc.bnbchain.org"],
    blockExplorerUrls: ["https://testnet.opbnbscan.com"],
    nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 }
  }
} as const;

export const SUPPORTED_CHAIN_IDS = [97, 5611];

export function chainName(chainId?: number): string {
  if (!chainId) return "Unknown";
  if (chainId === 97) return "BSC Testnet";
  if (chainId === 5611) return "opBNB Testnet";
  return `Unsupported (${chainId})`;
}

export function explorerBase(chainId?: number): string {
  return chainId === 5611 ? "https://testnet.opbnbscan.com" : "https://testnet.bscscan.com";
}

export async function switchToSupportedChain(targetChainId: number) {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No wallet provider detected.");

  const chain = CHAINS[targetChainId as 97 | 5611];
  if (!chain) throw new Error("Unsupported target chain.");

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chain.chainIdHex }]
    });
  } catch (error: any) {
    if (error?.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chain.chainIdHex,
            chainName: chain.chainName,
            rpcUrls: chain.rpcUrls,
            blockExplorerUrls: chain.blockExplorerUrls,
            nativeCurrency: chain.nativeCurrency
          }
        ]
      });
      return;
    }
    throw error;
  }
}
