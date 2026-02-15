import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ConnectButton from "../components/ConnectButton";
import YieldPanel from "../components/YieldPanel";
import AssistantPanel from "../components/AssistantPanel";
import { chainName, SUPPORTED_CHAIN_IDS } from "../lib/chain";
import { readSnapshot } from "../lib/onchain";

export default function YieldPage() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState<number>(Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 97));
  const [snapshot, setSnapshot] = useState({
    address: "",
    userBalance: "0.0000",
    vaultBalance: "0.0000",
    totalAssets: "0.0000",
    apy: "0.00"
  });

  const wrongChain = !SUPPORTED_CHAIN_IDS.includes(chainId);

  async function refresh() {
    if (!provider || !address || wrongChain) return;
    try {
      const snap = await readSnapshot(provider, address, chainId);
      setSnapshot({
        address,
        userBalance: snap.musdcBalance,
        vaultBalance: snap.vaultBalance,
        totalAssets: snap.totalAssets,
        apy: snap.apy
      });
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    void refresh();
  }, [provider, address, chainId]);

  async function onConnected(p: ethers.providers.Web3Provider, addr: string, cid: number) {
    setProvider(p);
    setAddress(addr);
    setChainId(cid);
  }

  return (
    <main className="container" style={{ marginTop: 24, marginBottom: 40 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h1>Yield Intelligence</h1>
          <p className="muted">Network: {chainName(chainId)}</p>
        </div>
        <ConnectButton onConnected={onConnected} />
      </div>

      {wrongChain && <p className="tx-err">Switch wallet to BSC Testnet (97) or opBNB Testnet (5611).</p>}

      <div className="grid-2" style={{ marginTop: 14 }}>
        <YieldPanel apy={snapshot.apy} />
        <AssistantPanel snapshot={snapshot} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Snapshot used by assistant</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Balance: {snapshot.userBalance} mUSDC | Vault: {snapshot.vaultBalance} mUSDC | Total Assets:
          {" "}{snapshot.totalAssets} mUSDC | APY: {snapshot.apy}%
        </p>
      </div>
    </main>
  );
}
