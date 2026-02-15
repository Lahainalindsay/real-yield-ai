type Props = {
  apy: string;
};

const history = [3.8, 4.0, 4.1, 4.2, 4.4, 4.5, 4.5];

export default function YieldPanel({ apy }: Props) {
  const max = Math.max(...history, 5);

  return (
    <div className="card">
      <h2>Live Yield</h2>
      <p className="muted" style={{ marginTop: 8 }}>APY from `YieldOracleMock.currentAPYBps`</p>
      <h3 style={{ marginTop: 10 }}>{apy}%</h3>

      <div className="chart" style={{ marginTop: 14 }}>
        {history.map((v, i) => (
          <div
            key={i}
            className="bar"
            style={{ height: `${(v / max) * 100}%` }}
            title={`Day ${i + 1}: ${v}%`}
          />
        ))}
      </div>

      <p className="muted" style={{ marginTop: 12 }}>
        7-day chart is demo history for MVP visualization. Live APY value above is read directly onchain.
      </p>
    </div>
  );
}
