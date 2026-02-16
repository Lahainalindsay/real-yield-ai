const steps = [
  { title: "Deposit", text: "Approve mUSDC and deposit into the vault." },
  { title: "Monitor", text: "Read APY and onchain strategy metrics in real time." },
  { title: "Decide", text: "Use deterministic opportunity/risk scores and AI explanations." },
  { title: "Execute", text: "Agent can switch active strategy onchain when rule is satisfied." }
];

export default function HowItWorks() {
  return (
    <div className="container" style={{ marginTop: 28, marginBottom: 30 }}>
      <h2 style={{ marginBottom: 16 }}>How it Works</h2>
      <div className="grid-4">
        {steps.map((step, i) => (
          <div className="card" key={step.title}>
            <p className="muted">Step {i + 1}</p>
            <h3 style={{ marginTop: 8 }}>{step.title}</h3>
            <p className="muted" style={{ marginTop: 8 }}>{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
