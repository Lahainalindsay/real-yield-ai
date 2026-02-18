import React from "react";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";

function Step({
  n,
  title,
  desc,
  badge,
}: {
  n: string;
  title: string;
  desc: string;
  badge: "good" | "warn" | "default";
}) {
  return (
    <Card className="card2">
      <CardBody>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div className="h3">{title}</div>
          <Badge variant={badge === "default" ? "default" : badge}>{n}</Badge>
        </div>
        <hr className="hr" />
        <p className="muted" style={{ marginTop: 0 }}>
          {desc}
        </p>
      </CardBody>
    </Card>
  );
}

export default function HowItWorks() {
  return (
    <section className="page">
      <div className="container">
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          <h2 className="h2">How it works</h2>
          <p className="muted">A transparent, deterministic workflow: deposit → monitor → score → explain.</p>
          <p className="muted2" style={{ marginTop: -2 }}>Every output is reproducible. Built to scale from demo flow to production agent operations.</p>
        </div>

        <div className="grid grid-2">
          <Step
            n="01"
            title="Deposit"
            badge="good"
            desc="Connect your wallet on testnet, approve mock USDC, and deposit into the vault. All transactions are explorer-linked for full verification."
          />
          <Step
            n="02"
            title="Monitor"
            badge="default"
            desc="Live onchain metrics power the strategy engine. The frontend snapshots state in batches for fast, consistent updates."
          />
          <Step
            n="03"
            title="Decide"
            badge="warn"
            desc="A deterministic scoring engine evaluates opportunity, risk, and confidence. The output includes a recommendation plus structured reason flags."
          />
          <Step
            n="04"
            title="Explain"
            badge="default"
            desc="The assistant translates deterministic outputs into plain English. It explains — never executes transactions or promises returns."
          />
        </div>
      </div>
    </section>
  );
}
