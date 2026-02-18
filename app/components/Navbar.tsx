import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

function NavLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  const active = router.pathname === href;
  return (
    <Link href={href} className={`nav-link ${active ? "nav-link-active" : ""}`}>
      {label}
    </Link>
  );
}

export default function Navbar() {
  return (
    <div className="nav">
      <div className="container nav-inner">
        <div className="nav-left">
          <Link href="/" className="brand" aria-label="Real BNB Vault Home">
            <span className="brand-dot" />
            <span>real-bnb-vault</span>
          </Link>
          <div className="nav-links" aria-label="Primary navigation">
            <NavLink href="/" label="Home" />
            <NavLink href="/app" label="Vault" />
            <NavLink href="/yield" label="Yield" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="badge">BSC Testnet / opBNB Testnet</span>
        </div>
      </div>
    </div>
  );
}
