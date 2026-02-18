import React from "react";
import { Button } from "./ui/Button";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Toast } from "./ui/Toast";

type TxState =
  | { status: "idle" }
  | { status: "pending"; label: string; hash?: string }
  | { status: "success"; label: string; hash?: string }
  | { status: "error"; label: string; error: string; hash?: string };

export default function VaultPanel(props: {
  chainId?: number;
  address?: string;
  isSupportedChain: boolean;
  chainName?: string;
  explorerBase?: string;
  onSwitchNetwork?: () => Promise<void> | void;

  balance?: string;
  apy?: string;
  amount: string;
  setAmount: (v: string) => void;

  canApprove: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;

  onApprove: () => Promise<void>;
  onDeposit: () => Promise<void>;
  onWithdraw: () => Promise<void>;

  tx: TxState;
}) {
  const {
    chainId,
    address,
    isSupportedChain,
    chainName,
    explorerBase,
    onSwitchNetwork,
    balance,
    apy,
    amount,
    setAmount,
    canApprove,
    canDeposit,
    canWithdraw,
    onApprove,
    onDeposit,
    onWithdraw,
    tx,
  } = props;

  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Not connected";
  const txUrl = tx && "hash" in tx && tx.hash && explorerBase ? `${explorerBase}/tx/${tx.hash}` : null;

  const networkBadge = isSupportedChain ? (
    <Badge variant="good">{chainName ?? `Chain ${chainId ?? "—"}`}</Badge>
  ) : (
    <Badge variant="warn">Wrong network</Badge>
  );

  return (
    <Card className="card2">
      <CardBody>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <div>
            <div className="h3">Vault</div>
            <div className="muted2" style={{ marginTop: 4 }}>
              Approve → Deposit → Withdraw (Testnet Only)
            </div>
            <div className="muted2" style={{ marginTop: 2 }}>Fully transparent. No hidden automation.</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {networkBadge}
            <span className="badge">{shortAddr}</span>
            {!isSupportedChain && onSwitchNetwork ? (
              <Button size="sm" variant="primary" onClick={onSwitchNetwork}>
                Switch network
              </Button>
            ) : null}
          </div>
        </div>

        <hr className="hr" />

        <div className="grid grid-2">
          <div className="stat">
            <div className="stat-k">Wallet balance</div>
            <div className="stat-v">{balance ?? "—"}</div>
            <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>Available testnet balance.</div>
          </div>
          <div className="stat">
            <div className="stat-k">Vault APY</div>
            <div className="stat-v">{apy ?? "—"}%</div>
            <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>Onchain calculated APY. No projections.</div>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="grid" style={{ gap: 10 }}>
          <label className="muted2" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Amount
          </label>
          <input
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.0"
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="primary" onClick={onApprove} disabled={!isSupportedChain || !canApprove}>
              Approve
            </Button>
            <Button onClick={onDeposit} disabled={!isSupportedChain || !canDeposit}>
              Deposit
            </Button>
            <Button variant="ghost" onClick={onWithdraw} disabled={!isSupportedChain || !canWithdraw}>
              Withdraw
            </Button>
          </div>

          {tx.status === "pending" ? (
            <Toast
              tone="warn"
              title={tx.label}
              detail="Transaction pending…"
              right={
                txUrl ? (
                  <a className="btn btn-sm" href={txUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                ) : null
              }
            />
          ) : null}

          {tx.status === "success" ? (
            <Toast
              tone="good"
              title={tx.label}
              detail="Confirmed"
              right={
                txUrl ? (
                  <a className="btn btn-sm btn-success" href={txUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                ) : null
              }
            />
          ) : null}

          {tx.status === "error" ? (
            <Toast tone="bad" title={tx.label} detail={tx.error} right={txUrl ? <a className="btn btn-sm" href={txUrl} target="_blank" rel="noreferrer">View</a> : null} />
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
