import { useState } from "react";

type Snapshot = {
  address: string;
  userBalance: string;
  vaultBalance: string;
  totalAssets: string;
  apy: string;
};

type Props = {
  snapshot: Snapshot;
};

const prompts = ["Explain my yield", "Why did APY change?", "What risks should I know?"];

export default function AssistantPanel({ snapshot }: Props) {
  const [question, setQuestion] = useState(prompts[0]);
  const [answer, setAnswer] = useState("Ask a question to get a plain-English explanation.");
  const [loading, setLoading] = useState(false);

  async function ask(q?: string) {
    const selected = q || question;
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: selected, snapshot })
      });
      const data = await res.json();
      setAnswer(data.answer || "No response.");
    } catch (e) {
      setAnswer("Assistant request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>AI Assistant</h2>
      <p className="muted" style={{ marginTop: 8 }}>
        AI explains onchain values. It does not transact or move funds.
      </p>

      <div className="row" style={{ marginTop: 12 }}>
        {prompts.map((p) => (
          <button
            type="button"
            key={p}
            className="btn btn-secondary"
            onClick={() => {
              setQuestion(p);
              void ask(p);
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <input
          className="input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about APY, risk, or balances"
        />
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" className="btn btn-primary" onClick={() => void ask()} disabled={loading}>
          {loading ? "Thinking..." : "Ask Assistant"}
        </button>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{answer}</p>
      </div>
    </div>
  );
}
