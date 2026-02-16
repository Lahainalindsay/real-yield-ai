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
    apy: "0.00",
    activeStrategyId: 0,
    strategyA: { name: "Strategy A", apyBps: 0, liquidityBps: 0, utilizationBps: 0, enabled: false },
    strategyB: { name: "Strategy B", apyBps: 0, liquidityBps: 0, utilizationBps: 0, enabled: false },
    opportunityScore: "0.0000",
    riskScoreB: "0.0000",
    recommendation: "Hold current strategy"
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
        apy: snap.apy,
        activeStrategyId: snap.activeStrategyId,
        strategyA: snap.strategyA,
        strategyB: snap.strategyB,
        opportunityScore: "0.0000",
        riskScoreB: "0.0000",
        recommendation: "Hold current strategy"
      });

      const apyDeltaBps = snap.strategyB.apyBps - snap.strategyA.apyBps;
      const liquidityDeltaBps = snap.strategyB.liquidityBps - snap.strategyA.liquidityBps;
      const opportunity = Math.max(0, Math.min(1, apyDeltaBps / 500 + liquidityDeltaBps / 10000));
      const riskB = Math.max(
        0,
        Math.min(1, snap.strategyB.utilizationBps / 10000 + (10000 - snap.strategyB.liquidityBps) / 10000)
      );
      const recommendSwitch =
        apyDeltaBps >= 200 && snap.strategyB.liquidityBps >= 7000 && riskB <= 0.6 && snap.strategyB.enabled;

      setSnapshot((prev) => ({
        ...prev,
        opportunityScore: opportunity.toFixed(4),
        riskScoreB: riskB.toFixed(4),
        recommendation: recommendSwitch ? "Switch to Strategy 2" : "Hold current strategy"
      }));
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
        <h3>Strategy Metrics</h3>
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>ID</th>
                <th style={{ textAlign: "left" }}>Name</th>
                <th style={{ textAlign: "left" }}>APY (bps)</th>
                <th style={{ textAlign: "left" }}>Liquidity (bps)</th>
                <th style={{ textAlign: "left" }}>Utilization (bps)</th>
                <th style={{ textAlign: "left" }}>Enabled</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{snapshot.strategyA.name}</td>
                <td>{snapshot.strategyA.apyBps}</td>
                <td>{snapshot.strategyA.liquidityBps}</td>
                <td>{snapshot.strategyA.utilizationBps}</td>
                <td>{String(snapshot.strategyA.enabled)}</td>
              </tr>
              <tr>
                <td>2</td>
                <td>{snapshot.strategyB.name}</td>
                <td>{snapshot.strategyB.apyBps}</td>
                <td>{snapshot.strategyB.liquidityBps}</td>
                <td>{snapshot.strategyB.utilizationBps}</td>
                <td>{String(snapshot.strategyB.enabled)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Deterministic Recommendation</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Active Strategy: {snapshot.activeStrategyId} | Opportunity Score: {snapshot.opportunityScore} | Risk Score B:
          {" "}{snapshot.riskScoreB}
        </p>
        <p style={{ marginTop: 8 }}>
          Recommended Action: <strong>{snapshot.recommendation}</strong>
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Snapshot used by assistant</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Balance: {snapshot.userBalance} mUSDC | Vault: {snapshot.vaultBalance} mUSDC | Total Assets:{" "}
          {snapshot.totalAssets} mUSDC | APY: {snapshot.apy}% | Active Strategy: {snapshot.activeStrategyId}
        </p>
      </div>
    </main>
  );
}
