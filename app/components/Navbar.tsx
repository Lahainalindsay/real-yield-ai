import Link from "next/link";

export default function Navbar() {
  return (
    <div style={{ borderBottom: "1px solid rgba(180,199,229,.2)", backdropFilter: "blur(8px)" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontWeight: 800 }}>Real BNB Vault</Link>
        <div className="row">
          <Link href="/app">App</Link>
          <Link href="/yield">Yield</Link>
        </div>
      </div>
    </div>
  );
}
