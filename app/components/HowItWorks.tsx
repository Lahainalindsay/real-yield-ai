const steps = [
  { title: "Deposit", text: "Approve mUSDC and deposit into the vault." },
  { title: "Allocate", text: "Vault tracks pooled assets for strategy allocation." },
  { title: "Earn", text: "Mock oracle updates APY and yield projections." },
  { title: "Withdraw", text: "Withdraw principal from your vault balance." }
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
