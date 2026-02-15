const items = [
  "Onchain APY Oracle",
  "Self-custody Wallet",
  "Transparent Vault TVL",
  "AI Yield Explainer"
];

export default function FeatureBadges() {
  return (
    <div className="container" style={{ marginTop: -30 }}>
      <div className="row">
        {items.map((item) => (
          <span key={item} className="badge">{item}</span>
        ))}
      </div>
    </div>
  );
}
