import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import type { NextPage } from "next";
import { ethers } from "ethers";

import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Toast } from "../components/ui/Toast";
import { Spinner } from "../components/ui/Spinner";
import AssistantPanel from "../components/AssistantPanel";

import { chainName, explorerBase, switchToSupportedChain } from "../lib/chain";
import { readSnapshot } from "../lib/onchain";

type Snapshot = any;

type StrategyRow = {
  id: number;
  apy: number;
  tvl: number;
  utilization: number;
  volatilityBps: number;
  label: string;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function scoreStrategy(s: StrategyRow) {
  const apyN = clamp01(s.apy / 25);
  const utilN = clamp01(s.utilization / 100);
  const tvlN = clamp01(Math.log10(Math.max(1, s.tvl)) / 8);
  const volN = clamp01(s.volatilityBps / 2000);

  const opportunity = clamp01(0.58 * apyN + 0.28 * utilN + 0.14 * tvlN);
  const risk = clamp01(0.62 * volN + 0.30 * utilN + 0.08 * (1 - tvlN));
  const confidence = clamp01(opportunity * 0.65 + (1 - risk) * 0.35);

  return {
    opportunityScore: Math.round(opportunity * 100),
    riskScoreB: Math.round(risk * 100),
    confidenceScore: Math.round(confidence * 100),
  };
}

const YieldPage: NextPage = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const supported = useMemo(() => chainId === 97 || chainId === 5611, [chainId]);
  const cName = useMemo(() => (chainId ? chainName(chainId) : undefined), [chainId]);
  const explorer = useMemo(() => (chainId ? explorerBase(chainId) : undefined), [chainId]);

  const connect = useCallback(async () => {
    const Web3Modal = (await import("web3modal")).default;
    const modal = new Web3Modal({ cacheProvider: true });
    const instance = await modal.connect();
    const p = new ethers.providers.Web3Provider(instance, "any");
    setProvider(p);

    const signer = p.getSigner();
    setAddress(await signer.getAddress());

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

  const refresh = useCallback(async () => {
    if (!provider || !address || !chainId) return;
    setLoading(true);
    setErr(null);
    try {
      const s = await readSnapshot(provider, address, chainId);
      setSnapshot(s);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to read onchain state.");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [provider, address, chainId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const doSwitchNetwork = useCallback(async () => {
    if (!chainId) return;
    await switchToSupportedChain(chainId === 97 || chainId === 5611 ? chainId : 97);
  }, [chainId]);

  const strategies: StrategyRow[] = useMemo(() => {
    const raw = snapshot?.strategies ?? snapshot?.strategyData ?? snapshot?.strategyTable;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((r: any, i: number) => ({
        id: Number(r.id ?? r.strategyId ?? i),
        apy: Number(r.apy ?? (r.apyBps ? Number(r.apyBps) / 100 : r.apyPercent ?? 0)),
        tvl: Number(r.tvl ?? r.totalAssets ?? 0),
        utilization: Number(r.utilization ?? r.util ?? 0),
        volatilityBps: Number(r.volatilityBps ?? r.volBps ?? 0),
        label: String(r.label ?? r.name ?? `Strategy ${Number(r.id ?? i)}`),
      }));
    }

    return [
      { id: 1, apy: Number(snapshot?.apy ?? 6), tvl: 250_000, utilization: 62, volatilityBps: 420, label: "Strategy 1" },
      { id: 2, apy: Number(snapshot?.apy ?? 6) + 3, tvl: 180_000, utilization: 74, volatilityBps: 780, label: "Strategy 2" },
      { id: 3, apy: Number(snapshot?.apy ?? 6) - 1, tvl: 420_000, utilization: 55, volatilityBps: 260, label: "Strategy 3" },
    ];
  }, [snapshot]);

  const scored = useMemo(() => {
    return strategies.map((s) => ({ ...s, ...scoreStrategy(s) }));
  }, [strategies]);

  const best = useMemo(() => {
    if (!scored.length) return null;
    return [...scored].sort((a, b) => {
      const da = a.opportunityScore - a.riskScoreB;
      const db = b.opportunityScore - b.riskScoreB;
      if (db !== da) return db - da;
      return b.confidenceScore - a.confidenceScore;
    })[0];
  }, [scored]);

  const recommendation = useMemo(() => {
    const active = Number(snapshot?.activeStrategy ?? snapshot?.activeStrategyId ?? snapshot?.strategyId ?? 1);
    if (!best) return { title: "—", detail: "No strategy data." };

    const shouldSwitch = best.id !== active && best.opportunityScore - best.riskScoreB >= 10 && best.confidenceScore >= 55;
    if (!supported) {
      return { title: "Connect to a supported chain", detail: "Switch to BSC Testnet (97) or opBNB Testnet (5611) to see live metrics." };
    }
    if (!snapshot) {
      return { title: "Load onchain data", detail: "Connect wallet and refresh to compute deterministic scores." };
    }
    return shouldSwitch
      ? {
          title: `Recommendation: Switch to ${best.label}`,
          detail: `Opportunity outweighs risk by ${(best.opportunityScore - best.riskScoreB).toFixed(0)} pts with ${best.confidenceScore}% confidence.`,
        }
      : {
          title: "Recommendation: Hold current strategy",
          detail: `No sufficiently better risk-adjusted opportunity detected (confidence ${best.confidenceScore}%).`,
        };
  }, [best, snapshot, supported]);

  const riskTone = useMemo(() => {
    if (!best) return "info" as const;
    if (best.riskScoreB >= 70) return "bad" as const;
    if (best.riskScoreB >= 50) return "warn" as const;
    return "good" as const;
  }, [best]);

  const assistantSnapshot = useMemo(() => {
    return {
      ...(snapshot ?? {}),
      yieldDashboard: {
        strategies: scored,
        bestCandidate: best,
        recommendation,
      },
    };
  }, [snapshot, scored, best, recommendation]);

  return (
    <>
      <Head>
        <title>Yield • real-bnb-vault</title>
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
                Yield Intelligence
              </h1>
              <div className="muted" style={{ maxWidth: 860 }}>
                Verifiable yield intelligence for autonomous allocation: deterministic opportunity/risk/confidence scoring powered by onchain reads.
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
              {!provider || !address ? (
                <Button variant="primary" onClick={connect}>
                  Connect wallet
                </Button>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span className="badge">{address.slice(0, 6)}…{address.slice(-4)}</span>
                  <Badge variant={supported ? "good" : "warn"}>{supported ? (cName ?? `Chain ${chainId}`) : "Wrong network"}</Badge>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Button size="sm" onClick={refresh} disabled={!provider || !address || loading}>
                  {loading ? "Refreshing…" : "Refresh metrics"}
                </Button>
                {provider && !supported ? (
                  <Button size="sm" variant="primary" onClick={doSwitchNetwork}>
                    Switch network
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div style={{ height: 14 }} />

          {err ? <Toast tone="bad" title="Onchain read failed" detail={err} /> : null}
          {loading ? <div style={{ marginTop: 10 }}><Spinner label="Computing strategy scores…" /></div> : null}

          <div style={{ height: 16 }} />

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
              <a className="btn btn-sm" href="#recommendation">Recommendation</a>
              <a className="btn btn-sm" href="#strategies">Strategy table</a>
              <a className="btn btn-sm" href="#simulation">Simulation</a>
              <a className="btn btn-sm" href="#assistant">Assistant</a>
            </div>
          </div>

          <div style={{ height: 16 }} />

          <div id="recommendation" className="grid grid-2">
            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Deterministic recommendation</div>
                  <Badge variant={riskTone === "bad" ? "bad" : riskTone === "warn" ? "warn" : riskTone === "good" ? "good" : "default"}>
                    {best ? `Risk ${best.riskScoreB}%` : "—"}
                  </Badge>
                </div>

                <hr className="hr" />

                <div className="grid" style={{ gap: 10 }}>
                  <div className="stat">
                    <div className="stat-k">Decision</div>
                    <div className="stat-v" style={{ fontSize: 18 }}>
                      {recommendation.title}
                    </div>
                  </div>

                  <Toast
                    tone={riskTone}
                    title="Safety framing"
                    detail={
                      best
                        ? `Opportunity ${best.opportunityScore}% • Risk ${best.riskScoreB}% • Confidence ${best.confidenceScore}%`
                        : "Connect and refresh to compute scores."
                    }
                  />

                  <p className="muted2" style={{ fontSize: 12 }}>
                    Deterministic by design and ready for policy-hardening: the same scoring layer can power real protocol automation with guardrails.
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Why this feels safe</div>
                  <Badge>UX guardrails</Badge>
                </div>
                <hr className="hr" />
                <div className="grid" style={{ gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span className="badge">Network checks</span>
                    <span className="badge">Explorer links</span>
                    <span className="badge">Risk-first copy</span>
                    <span className="badge">Deterministic scoring</span>
                  </div>
                  <p className="muted">
                    The model is explainable by design: each ranking is score-based, reproducible, and ready to plug into governed execution.
                  </p>
                  {explorer ? (
                    <a className="btn btn-sm" href={explorer} target="_blank" rel="noreferrer">
                      Open explorer
                    </a>
                  ) : (
                    <span className="badge">Explorer not available</span>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div style={{ height: 16 }} />

          <div id="strategies" className="grid">
            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div className="h3">Strategy table</div>
                    <div className="muted2">Compare deterministic opportunity, risk, and confidence scores across strategies.</div>
                  </div>
                  <Badge>{scored.length} strategies</Badge>
                </div>

                <hr className="hr" />

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ textAlign: "left" }}>
                        {["Strategy", "APY", "TVL", "Util", "Vol", "Opportunity", "Risk", "Confidence"].map((h) => (
                          <th
                            key={h}
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.65)",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              padding: "10px 10px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scored.map((s) => {
                        const isBest = best?.id === s.id;
                        const riskV = s.riskScoreB >= 70 ? "bad" : s.riskScoreB >= 50 ? "warn" : "good";
                        return (
                          <tr key={s.id} style={{ background: isBest ? "rgba(96,165,250,0.08)" : "transparent" }}>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <span className="badge">{s.label}</span>
                                {isBest ? <Badge variant="good">Highest Composite Score</Badge> : null}
                              </div>
                            </td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{s.apy.toFixed(2)}%</td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{Math.round(s.tvl).toLocaleString()}</td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{s.utilization.toFixed(0)}%</td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{s.volatilityBps.toFixed(0)} bps</td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                              <Badge variant="good">{s.opportunityScore}%</Badge>
                            </td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                              <Badge variant={riskV === "bad" ? "bad" : riskV === "warn" ? "warn" : "good"}>{s.riskScoreB}%</Badge>
                            </td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                              <Badge>{s.confidenceScore}%</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="muted2" style={{ fontSize: 12, marginTop: 12 }}>
                  Tip: wire `strategies` to real onchain fields when available (APY/TVL/utilization/vol). The scoring stays deterministic.
                </p>
              </CardBody>
            </Card>
          </div>

          <div style={{ height: 16 }} />

          <div id="simulation" className="grid grid-2">
            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Simulation panel</div>
                  <Badge>Non-transactional</Badge>
                </div>
                <hr className="hr" />
                <p className="muted">
                  This panel is designed for "safe exploration": it proposes what an action might look like, but does not execute transactions.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="btn" href="/api/autonomous-action" target="_blank" rel="noreferrer">
                    View proposedActions (API)
                  </a>
                  <span className="badge">Guardrails enforced</span>
                </div>
              </CardBody>
            </Card>

            <Card className="card2">
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="h3">Assistant-ready context</div>
                  <Badge>Snapshot</Badge>
                </div>
                <hr className="hr" />
                <p className="muted">
                  The assistant can explain the exact deterministic result because we pass a structured snapshot (scores + inputs).
                </p>
                <div className="tx">
                  <div className="tx-left">
                    <div className="tx-title">Best candidate</div>
                    <div className="tx-meta">{best ? `${best.label} (conf ${best.confidenceScore}%)` : "—"}</div>
                  </div>
                  <span className="tx-status tx-status-warn">explain</span>
                </div>
              </CardBody>
            </Card>
          </div>

          <div style={{ height: 16 }} />

          <div id="assistant">
            <AssistantPanel snapshot={assistantSnapshot} />
          </div>

          <div style={{ height: 18 }} />

          <p className="muted2" style={{ fontSize: 12 }}>
            Testnet-validated strategy intelligence with reproducible scoring outputs.
            <br />
            Production path: protocol-specific risk adaptors, monitoring, and governance-bound execution.
          </p>
        </div>
      </div>
    </>
  );
};

export default YieldPage;
