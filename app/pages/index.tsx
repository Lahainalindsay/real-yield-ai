import Hero from "../components/Hero";
import FeatureBadges from "../components/FeatureBadges";
import HowItWorks from "../components/HowItWorks";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <FeatureBadges />
      <HowItWorks />
      <div className="container" style={{ marginBottom: 50 }}>
        <div className="card" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="#">Proof of Reserves</a>
          <a href="#">Audits</a>
          <a href="#">DAO</a>
        </div>
      </div>
    </>
  );
}
