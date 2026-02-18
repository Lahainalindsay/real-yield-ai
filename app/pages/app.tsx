import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import type { NextPage } from "next";
import { ethers } from "ethers";

import VaultPanel from "../components/VaultPanel";
import AssistantPanel from "../components/AssistantPanel";
import YieldPanel from "../components/YieldPanel";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Toast } from "../components/ui/Toast";
import { Spinner } from "../components/ui/Spinner";

import { chainName, explorerBase, switchToSupportedChain } from "../lib/chain";
import { contractsFromProvider, resolveDeployment } from "../lib/contracts";
import { readSnapshot } from "../lib/onchain";

type DeploymentJson = {
  chainId?: number;
  erc20?: string;
  vault?: string;
  oracle?: string;
  strategyManager?: string;
};

type DecisionLog = {
  timestamp?: number | string;
  chainId?: number;
  activeStrategy?: number;
  recommendation?: string;
  opportunityScore?: number;
  riskScoreB?: number;
  confidenceScore?: number;
  reasonFlags?: string[] | number[] | Record<string, any>;
  txHashes?: string[];
  notes?: string;
};

type ProofJson = {
  chainId?: number;
  approveTxHash?: string;
  depositTxHash?: string;
  token?: string;
  vault?: string;
  amount?: string;
};

type Snapshot = any;

type TxState =
  | { status: "idle" }
  | { status: "pending"; label: string; hash?: string }
  | { status: "success"; label: string; hash?: string }
  | { status: "error"; label: string; error: string; hash?: string };

function shortHash(h?: string) {
  if (!h) return "—";
  return `${h.slice(0, 10)}…${h.slice(-8)}`;
}

function pickReasonText(flags: any): string[] {
  if (!flags) return [];
  if (Array.isArray(flags)) return flags.map(String);
  if (typeof flags === "object") return Object.keys(flags);
  return [String(flags)];
}

const AppPage: NextPage = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapError, setSnapError] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>("");

  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const [deployment, setDeployment] = useState<DeploymentJson | null>(null);
  const [decisionLog, setDecisionLog] = useState<DecisionLog | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<DecisionLog[] | null>(null);
  const [proof, setProof] = useState<ProofJson | null>(null);

  const supported = useMemo(() => chainId === 97 || chainId === 5611, [chainId]);
  const cName = useMemo(() => (chainId ? chainName(chainId) : undefined), [chainId]);
  const explorer = useMemo(() => (chainId ? explorerBase(chainId) : undefined), [chainId]);

  const canTransact = !!provider && !!address && supported;

  const connect = useCallback(async () => {
    const Web3Modal = (await import("web3modal")).default;
    const modal = new Web3Modal({ cacheProvider: true });
    const instance = await modal.connect();
    const p = new ethers.providers.Web3Provider(instance, "any");
    setProvider(p);

    const signer = p.getSigner();
    const addr = await signer.getAddress();
    setAddress(addr);

    const net = await p.getNetwork();
    setChainId(net.chainId);

    instance.on?.("chainChanged", async () => {
      const n = await p.getNetwork();
      setChainId(n.chainId);
    });

    instance.on?.("accountsChanged", async (accounts: string[]) => {
      setAddress(accounts?.[0]);
    });
  }, []);

  const disconnect = useCallback(async () => {
    setProvider(null);
    setAddress(undefined);
    setChainId(undefined);
    setSnapshot(null);
    setTx({ status: "idle" });

    try {
      const Web3Modal = (await import("web3modal")).default;
      const modal = new Web3Modal({ cacheProvider: true });
      await modal.clearCachedProvider();
    } catch {
      // ignore
    }
  }, []);

  const loadArtifacts = useCallback(async (cid?: number) => {
    if (!cid) return;

    const idForArtifacts = cid === 97 ? 97 : cid === 5611 ? 5611 : 97;

    const base = "/deployments";
    const [depR, logR, histR, proofR] = await Promise.allSettled([
      fetch(`${base}/${idForArtifacts}.json`),
      fetch(`${base}/decision-log-${idForArtifacts}.json`),
      fetch(`${base}/decision-history-${idForArtifacts}.json`),
      fetch(`${base}/proof-${idForArtifacts}.json`),
    ]);

    async function read<T>(r: PromiseSettledResult<Response>): Promise<T | null> {
      if (r.status !== "fulfilled") return null;
      if (!r.value.ok) return null;
      return (await r.value.json()) as T;
    }

    setDeployment(await read<DeploymentJson>(depR));
    setDecisionLog(await read<DecisionLog>(logR));
    setDecisionHistory(await read<DecisionLog[]>(histR));
    setProof(await read<ProofJson>(proofR));
  }, []);

  const refreshSnapshot = useCallback(async () => {
    if (!provider || !address || !chainId) return;

    setSnapLoading(true);
    setSnapError(null);

    try {
      const snap = await readSnapshot(provider, address, chainId);
      setSnapshot(snap);
    } catch (e: any) {
      setSnapError(e?.message ?? "Failed to read onchain snapshot.");
      setSnapshot(null);
    } finally {
      setSnapLoading(false);
    }
  }, [provider, address, chainId]);

  useEffect(() => {
    if (!chainId) return;
    void loadArtifacts(chainId);
  }, [chainId, loadArtifacts]);

  useEffect(() => {
    void refreshSnapshot();
  }, [refreshSnapshot]);

  async function withTx(label: string, fn: () => Promise<ethers.providers.TransactionResponse>) {
    setTx({ status: "pending", label });
    try {
      const r = await fn();
      setTx({ status: "pending", label, hash: r.hash });
      const receipt = await r.wait();
      if (receipt.status !== 1) throw new Error("Transaction failed.");
      setTx({ status: "success", label, hash: r.hash });
      await refreshSnapshot();
    } catch (e: any) {
      setTx({ status: "error", label, error: e?.message ?? "Transaction error." });
    }
  }

  const actions = useMemo(() => {
    if (!snapshot) {
      return {
        balance: "—",
        apy: "—",
        canApprove: false,
        canDeposit: false,
        canWithdraw: false,
      };
    }

    const bal = snapshot?.musdcBalance ?? snapshot?.balance ?? snapshot?.walletBalance ?? snapshot?.erc20Balance ?? "—";
    const apy = snapshot?.apy ?? snapshot?.vaultApy ?? snapshot?.currentApy ?? "—";

    const allowanceOk =
      snapshot?.allowanceOk ??
      snapshot?.hasAllowance ??
      (typeof snapshot?.allowance === "string" ? Number(snapshot.allowance) > 0 : !!snapshot?.allowance);

    const hasAmount = Number(amount || "0") > 0;

    return {
      balance: String(bal),
      apy: String(apy),
      canApprove: canTransact && hasAmount && !allowanceOk,
      canDeposit: canTransact && hasAmount && !!allowanceOk,
      canWithdraw: canTransact && hasAmount,
    };
  }, [snapshot, amount, canTransact]);

  const doSwitchNetwork = useCallback(async () => {
    if (!chainId) return;
    await switchToSupportedChain(chainId === 97 || chainId === 5611 ? chainId : 97);
  }, [chainId]);

  const doApprove = useCallback(async () => {
    if (!provider || !chainId) return;
    const deploymentCfg = await resolveDeployment(chainId);
    const { erc20, vault } = contractsFromProvider(provider, deploymentCfg);

    const parsed = ethers.utils.parseUnits(amount || "0", 18);
    await withTx("Approve USDC", async () => erc20.approve(vault.address, parsed));
  }, [provider, chainId, amount]);

  const doDeposit = useCallback(async () => {
    if (!provider || !chainId) return;
    const deploymentCfg = await resolveDeployment(chainId);
    const { vault } = contractsFromProvider(provider, deploymentCfg);

    const parsed = ethers.utils.parseUnits(amount || "0", 18);
    await withTx("Deposit to Vault", async () => vault.deposit(parsed));
  }, [provider, chainId, amount]);

  const doWithdraw = useCallback(async () => {
    if (!provider || !chainId) return;
    const deploymentCfg = await resolveDeployment(chainId);
    const { vault } = contractsFromProvider(provider, deploymentCfg);

    const parsed = ethers.utils.parseUnits(amount || "0", 18);
    await withTx("Withdraw from Vault", async () => vault.withdraw(parsed));
  }, [provider, chainId, amount]);

  const headerRight = useMemo(() => {
    if (!provider || !address) {
      return (
        <Button variant="primary" onClick={connect}>
          Connect wallet
        </Button>
      );
    }

    return (
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <span className="badge">{address.slice(0, 6)}…{address.slice(-4)}</span>
        <Badge variant={supported ? "good" : "warn"}>{supported ? (cName ?? `Chain ${chainId}`) : "Wrong network"}</Badge>
        <Button variant="ghost" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }, [provider, address, connect, disconnect, supported, cName, chainId]);

  const decisionFlags = useMemo(() => pickReasonText(decisionLog?.reasonFlags), [decisionLog]);

  return (
    <>
      <Head>
        <title>Vault • real-bnb-vault</title>
      </Head>

      <div className="page">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div className="kicker">
                <span className="badge">Deterministic</span>
                <span className="badge">Risk-aware</span>
                <span className="badge">Transparent artifacts</span>
                <span className="badge">Testnet only</span>
              </div>
              <h1 className="h2" style={{ fontSize: 34, margin: 0 }}>
                Vault Console
              </h1>
              <div className="muted" style={{ maxWidth: 820 }}>
                A working, verifiable agent console: deterministic scoring drives actions, artifacts make every decision auditable, and AI explains the why.
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
              {headerRight}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Button size="sm" onClick={refreshSnapshot} disabled={!provider || !address || snapLoading}>
                  {snapLoading ? "Refreshing…" : "Refresh data"}
                </Button>
                {provider && !supported ? (
                  <Button size="sm" variant="primary" onClick={doSwitchNetwork}>
                    Switch to supported chain
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div style={{ height: 18 }} />

          <div
            className="card2"
            style={{
              position: "sticky",
              top: 76,
              zIndex: 20,
              backdropFilter: "blur(12px)",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div className="card-pad" style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn btn-sm" href="#overview">Overview</a>
              <a className="btn btn-sm" href="#actions">Actions</a>
              <a className="btn btn-sm" href="#strategy">Strategy</a>
              <a className="btn btn-sm" href="#proof">Proof & artifacts</a>
              <a className="btn btn-sm" href="#assistant">Assistant</a>
            </div>
          </div>

          <div style={{ height: 16 }} />

          {snapError ? <Toast tone="bad" title="Onchain read failed" detail={snapError} /> : null}
          {snapLoading ? <div style={{ marginTop: 10 }}><Spinner label="Reading onchain state…" /></div> : null}
          <div style={{ height: 16 }} />

          <div id="overview" className="grid grid-3">
            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Safety signals</div>
                  <Badge variant={supported ? "good" : "warn"}>{supported ? "Supported chain" : "Wrong chain"}</Badge>
                </div>
                <hr className="hr" />
                <div style={{ display: "grid", gap: 8 }}>
                  <div className="muted2" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Active network
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="badge">{cName ?? "—"}</span>
                    <span className="badge">chainId: {chainId ?? "—"}</span>
                    {explorer ? <span className="badge">explorer linked</span> : <span className="badge">no explorer</span>}
                  </div>
                  <p className="muted" style={{ marginTop: 6 }}>
                    Always verify chain and tx links before interacting. This dApp is for testnet demos.
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Vault snapshot</div>
                  <Badge>Onchain</Badge>
                </div>
                <hr className="hr" />
                <div className="grid" style={{ gap: 10 }}>
                  <div className="stat">
                    <div className="stat-k">Wallet balance</div>
                    <div className="stat-v">{actions.balance}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-k">Current APY</div>
                    <div className="stat-v">{actions.apy}%</div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Decision posture</div>
                  <Badge variant="warn">No promises</Badge>
                </div>
                <hr className="hr" />
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span className="badge">Deterministic agent</span>
                    <span className="badge">Explainable flags</span>
                    <span className="badge">Proof JSON</span>
                  </div>
                  <p className="muted">
                    The agent decision path is deterministic and replayable: metrics in, score out, recommendation logged, proof exported.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          <div style={{ height: 16 }} />

          <div id="actions" className="grid grid-2">
            <VaultPanel
              chainId={chainId}
              address={address}
              isSupportedChain={supported}
              chainName={cName}
              explorerBase={explorer}
              onSwitchNetwork={doSwitchNetwork}
              balance={actions.balance}
              apy={actions.apy}
              amount={amount}
              setAmount={setAmount}
              canApprove={actions.canApprove}
              canDeposit={actions.canDeposit}
              canWithdraw={actions.canWithdraw}
              onApprove={doApprove}
              onDeposit={doDeposit}
              onWithdraw={doWithdraw}
              tx={tx}
            />

            <YieldPanel apy={actions.apy} trendLabel={snapshot?.trendLabel ?? snapshot?.trend ?? "Trend"} />
          </div>

          <div style={{ height: 16 }} />

          <div id="strategy" className="grid grid-2">
            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Active strategy</div>
                  <Badge>{decisionLog?.activeStrategy != null ? `Strategy ${decisionLog.activeStrategy}` : "—"}</Badge>
                </div>
                <hr className="hr" />
                <div className="grid" style={{ gap: 10 }}>
                  <div className="stat">
                    <div className="stat-k">Recommendation</div>
                    <div className="stat-v" style={{ fontSize: 18 }}>
                      {decisionLog?.recommendation || "No active recommendation yet."}
                    </div>
                  </div>

                  <div className="grid grid-3">
                    <div className="stat">
                      <div className="stat-k">Opportunity</div>
                      <div className="stat-v">{decisionLog?.opportunityScore ?? "—"}</div>
                      <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
                        Expected upside relative to historical performance.
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-k">Risk</div>
                      <div className="stat-v">{decisionLog?.riskScoreB ?? "—"}</div>
                      <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
                        Downside exposure based on volatility and liquidity metrics.
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-k">Confidence</div>
                      <div className="stat-v">{decisionLog?.confidenceScore ?? "—"}</div>
                      <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
                        Strength of signal based on scoring consistency.
                      </div>
                    </div>
                  </div>

                  {decisionFlags.length ? (
                    <div>
                      <div className="muted2" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Reason flags
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        {decisionFlags.slice(0, 10).map((f, i) => (
                          <span className="badge" key={`${f}-${i}`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="muted2" style={{ fontSize: 13 }}>
                      No reason flags found in decision log.
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Decision timeline</div>
                  <Badge>{decisionHistory?.length ? `${decisionHistory.length} runs` : "—"}</Badge>
                </div>
                <hr className="hr" />

                {decisionHistory?.length ? (
                  <div className="grid" style={{ gap: 10 }}>
                    {decisionHistory.slice(0, 5).map((d, idx) => {
                      const rawTs = d.timestamp;
                      const parsedTs = typeof rawTs === "number" ? rawTs * 1000 : Date.parse(String(rawTs || ""));
                      const t = Number.isFinite(parsedTs) ? new Date(parsedTs).toLocaleString() : "—";
                      return (
                        <div className="tx" key={idx}>
                          <div className="tx-left">
                            <div className="tx-title">
                              {d.recommendation ?? "Decision Snapshot"} • {d.activeStrategy != null ? `Strategy ${d.activeStrategy}` : "—"}
                            </div>
                            <div className="tx-meta">{t}</div>
                          </div>
                          <span className="tx-status tx-status-warn">view</span>
                        </div>
                      );
                    })}
                    <a
                      className="btn btn-sm"
                      href={`/deployments/decision-history-${chainId === 5611 ? "5611" : "97"}.json`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Export Full Decision History (JSON)
                    </a>
                  </div>
                ) : (
                  <p className="muted">No decision history found in /public/deployments.</p>
                )}
              </CardBody>
            </Card>
          </div>

          <div style={{ height: 16 }} />

          <div id="proof" className="grid grid-2">
            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Deployment addresses</div>
                  <Badge>Public JSON</Badge>
                </div>
                <p className="muted2" style={{ marginTop: 6 }}>
                  Smart contract addresses deployed on testnet. Click "View" to verify on explorer.
                </p>
                <hr className="hr" />

                {deployment ? (
                  <div className="grid" style={{ gap: 10 }}>
                    {(["erc20", "vault", "oracle", "strategyManager"] as const).map((k) => (
                      <div className="tx" key={k}>
                        <div className="tx-left">
                          <div className="tx-title">{k}</div>
                          <div className="tx-meta">{(deployment as any)[k] ?? "—"}</div>
                        </div>
                        {explorer && (deployment as any)[k] ? (
                          <a className="btn btn-sm" href={`${explorer}/address/${(deployment as any)[k]}`} target="_blank" rel="noreferrer">
                            View
                          </a>
                        ) : (
                          <span className="tx-status">—</span>
                        )}
                      </div>
                    ))}
                    <a className="btn btn-sm" href={`/deployments/${chainId === 5611 ? "5611" : "97"}.json`} target="_blank" rel="noreferrer">
                      Open deployments JSON
                    </a>
                  </div>
                ) : (
                  <p className="muted">
                    No deployments JSON found. Ensure `app/public/deployments/{'{'}chainId{'}'}.json` exists.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Proof transactions</div>
                  <Badge variant="good">Cryptographically Verifiable</Badge>
                </div>
                <p className="muted2" style={{ marginTop: 6 }}>
                  These transactions prove approval and deposit events tied to this vault instance.
                </p>
                <hr className="hr" />

                {proof ? (
                  <div className="grid" style={{ gap: 10 }}>
                    <div className="tx">
                      <div className="tx-left">
                        <div className="tx-title">Approve</div>
                        <div className="tx-meta">{shortHash(proof.approveTxHash)}</div>
                      </div>
                      {explorer && proof.approveTxHash ? (
                        <a className="btn btn-sm btn-success" href={`${explorer}/tx/${proof.approveTxHash}`} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        <span className="tx-status">—</span>
                      )}
                    </div>

                    <div className="tx">
                      <div className="tx-left">
                        <div className="tx-title">Deposit</div>
                        <div className="tx-meta">{shortHash(proof.depositTxHash)}</div>
                      </div>
                      {explorer && proof.depositTxHash ? (
                        <a className="btn btn-sm btn-success" href={`${explorer}/tx/${proof.depositTxHash}`} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        <span className="tx-status">—</span>
                      )}
                    </div>

                    <a className="btn btn-sm" href={`/deployments/proof-${chainId === 5611 ? "5611" : "97"}.json`} target="_blank" rel="noreferrer">
                      Open proof JSON
                    </a>
                  </div>
                ) : (
                  <p className="muted">
                    No proof JSON found. Ensure `app/public/deployments/proof-*.json` exists.
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          <div style={{ height: 16 }} />

          <div id="assistant">
            <AssistantPanel snapshot={snapshot ?? { note: "No snapshot loaded yet." }} />
          </div>

          <div style={{ height: 18 }} />

          <p className="muted2" style={{ fontSize: 12 }}>
            Testnet-validated agent workflow with verifiable outputs.
            <br />
            Production path: policy controls, deeper risk modules, and governance-driven execution boundaries.
          </p>
        </div>
      </div>
    </>
  );
};

export default AppPage;
