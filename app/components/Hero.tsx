import Link from "next/link";

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "calc(100vh - 75px)",
        backgroundImage:
          "linear-gradient(120deg, rgba(7,18,38,0.88), rgba(7,18,38,0.48)), url('/real_hero_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center"
      }}
    >
      <div className="container">
        <div className="card" style={{ maxWidth: 760 }}>
          <h1 style={{ fontSize: 48, lineHeight: 1.05 }}>Real Yield. Real Assets. No Noise.</h1>
          <p className="muted" style={{ marginTop: 14, fontSize: 18 }}>
            Onchain vault returns backed by real-world asset strategy logic (demo oracle), with transparent
            balances and APY sourced from smart contracts.
          </p>
          <div className="row" style={{ marginTop: 20 }}>
            <Link href="/app" className="btn btn-primary">Open App</Link>
            <Link href="/yield" className="btn btn-secondary">View Live Yield</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
