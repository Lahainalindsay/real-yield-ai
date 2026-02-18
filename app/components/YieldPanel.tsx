import React from "react";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";

export default function YieldPanel({ apy, trendLabel }: { apy?: string; trendLabel?: string }) {
  const bars = [18, 32, 26, 48, 54, 44, 62];

  return (
    <Card className="card2">
      <CardBody>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div className="h3">Yield</div>
            <div className="muted2" style={{ marginTop: 4 }}>
              Onchain APY + Illustrative 7-Day Trend
            </div>
            <div className="muted2" style={{ marginTop: 2, fontSize: 12 }}>APY is read directly from onchain state.</div>
          </div>
          <Badge variant={trendLabel?.toLowerCase().includes("up") ? "good" : trendLabel?.toLowerCase().includes("down") ? "bad" : "default"}>
            {trendLabel ?? "Trend"}
          </Badge>
        </div>

        <hr className="hr" />

        <div className="grid" style={{ gap: 12 }}>
          <div className="stat">
            <div className="stat-k">Current APY</div>
            <div className="stat-v">{apy ?? "—"}%</div>
          </div>

          <div className="chart" aria-label="Demo yield trend chart">
            {bars.map((h, i) => (
              <div key={i} className="bar" style={{ height: `${h}%` }} />
            ))}
          </div>

          <p className="muted2" style={{ fontSize: 12 }}>
            Note: the bar chart is illustrative; APY value above is from onchain reads.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
