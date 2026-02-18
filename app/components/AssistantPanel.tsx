import React, { useMemo, useState } from "react";
import { Button } from "./ui/Button";
import { Card, CardBody } from "./ui/Card";
import { Toast } from "./ui/Toast";
import { Spinner } from "./ui/Spinner";

type AssistantResponse = {
  answer?: string;
  source?: string;
  error?: string;
};

export default function AssistantPanel({ snapshot }: { snapshot: any }) {
  const presets = useMemo(
    () => [
      "Why is this the top strategy right now?",
      "What risks are driving the score?",
      "Why were the other strategies ranked lower?",
      "Summarize the decision factors clearly.",
    ],
    []
  );

  const [question, setQuestion] = useState(presets[0]);
  const [res, setRes] = useState<AssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, snapshot }),
      });
      const j = (await r.json()) as AssistantResponse;
      setRes(j);
    } catch (e: any) {
      setRes({ error: e?.message ?? "Request failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="card2">
      <CardBody>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div className="h3">Assistant</div>
            <div className="muted2" style={{ marginTop: 4 }}>
              Explains deterministic outputs in plain language.
            </div>
            <div className="muted2" style={{ marginTop: 2 }}>No transactions. No guarantees. No financial advice.</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => ask(question)} disabled={loading}>
            {loading ? "Asking..." : "Ask"}
          </Button>
        </div>

        <hr className="hr" />

        <div className="grid" style={{ gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {presets.map((p) => (
              <Button key={p} size="sm" className="" onClick={() => (setQuestion(p), ask(p))} disabled={loading}>
                {p}
              </Button>
            ))}
          </div>

          <textarea
            className="input"
            style={{ minHeight: 90, resize: "vertical" }}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the recommendation, risk, confidence..."
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="primary" onClick={() => ask(question)} disabled={loading || !question.trim()}>
              {loading ? "Working..." : "Ask assistant"}
            </Button>
            <Button variant="ghost" onClick={() => (setRes(null), setQuestion(presets[0]))} disabled={loading}>
              Reset
            </Button>
          </div>

          {loading ? <Spinner label="Generating explanation..." /> : null}

          {res?.error ? (
            <Toast tone="bad" title="Assistant error" detail={res.error} />
          ) : res?.answer ? (
            <div className="grid" style={{ gap: 10 }}>
              <Toast
                tone="good"
                title="Answer"
                detail={res.source ? `Source: ${res.source}` : "Source: assistant"}
              />
              <div className="card" style={{ borderRadius: 16 }}>
                <div className="card-pad">
                  <div className="muted2" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Explanation
                  </div>
                  <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{res.answer}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
