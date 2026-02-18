import React from "react";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";

export default function Home() {
  return (
    <div>
      <Hero />
      <HowItWorks />

      <footer className="page">
        <div className="container">
          <div className="card card2">
            <div className="card-pad">
              <div className="h3">Transparency artifacts</div>
              <p className="muted" style={{ maxWidth: 860 }}>
                Every recommendation and proof event is exported as verifiable JSON so judges, users, and future integrators
                can reproduce agent behavior and confirm execution on explorers.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <a className="btn" href="/deployments/97.json" target="_blank" rel="noreferrer">
                  Deployments (97)
                </a>
                <a className="btn" href="/deployments/decision-log-97.json" target="_blank" rel="noreferrer">
                  Decision log
                </a>
                <a className="btn" href="/deployments/decision-history-97.json" target="_blank" rel="noreferrer">
                  Decision history
                </a>
                <a className="btn" href="/deployments/proof-97.json" target="_blank" rel="noreferrer">
                  Proof
                </a>
              </div>
              <p className="muted2" style={{ fontSize: 12, marginTop: 12 }}>
                Testnet-validated architecture for autonomous DeFi decisioning.
                <br />
                Next step to production: stronger risk controls, monitoring, and governance policy hooks.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
