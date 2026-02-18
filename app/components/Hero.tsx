import Link from "next/link";
import React from "react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" style={{ backgroundImage: "url(/real_hero_bg.png)" }} />
      <div className="hero-overlay" />

      <div className="hero-inner">
        <p className="muted2" style={{ margin: 0 }}>
          A verifiable onchain strategy agent: deterministic logic executes, AI explains, artifacts prove.
        </p>

        <div className="kicker">
          <span className="badge">Transparent</span>
          <span className="badge">Deterministic agent</span>
          <span className="badge">AI explanation</span>
        </div>

        <h1 className="h1">Autonomous DeFi decisioning you can verify.</h1>

        <p className="muted" style={{ fontSize: 16, maxWidth: 820 }}>
          This is a working, testnet-validated agent stack: onchain metrics feed deterministic scoring, recommendations are
          reproducible, and AI translates every decision into plain English for operators and users.
        </p>

        <div className="hero-cta">
          <Link href="/app">
            <Button variant="primary" size="lg">
              Open Vault
            </Button>
          </Link>
          <Link href="/yield">
            <Button variant="ghost" size="lg">
              Yield Dashboard
            </Button>
          </Link>
          <a href="/deployments/decision-log-97.json" target="_blank" rel="noreferrer">
            <Button size="lg">View Decision Log</Button>
          </a>
        </div>

        <div className="hero-bullets">
          <Badge variant="good">Reproducible runs</Badge>
          <Badge variant="warn">No guaranteed returns</Badge>
          <Badge>Agent-native architecture</Badge>
          <Badge>Explorer-linked proof</Badge>
        </div>

        <div className="stats" style={{ marginTop: 16 }}>
          <div className="stat">
            <div className="stat-k">Networks</div>
            <div className="stat-v">97 / 5611</div>
            <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
              Active deployments across supported networks.
            </div>
          </div>
          <div className="stat">
            <div className="stat-k">Artifacts</div>
            <div className="stat-v" style={{ fontSize: 18 }}>Verifiable Decision & Proof Artifacts</div>
            <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
              Every recommendation is reproducible from exported JSON.
            </div>
          </div>
          <div className="stat">
            <div className="stat-k">Explainability</div>
            <div className="stat-v" style={{ fontSize: 18 }}>Deterministic Engine + AI Explanation</div>
            <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>
              Math decides. AI explains.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
