import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type Snapshot = {
  address?: string;
  userBalance?: string;
  vaultBalance?: string;
  totalAssets?: string;
  apy?: string;
  activeStrategyId?: number;
  opportunityScore?: string;
  riskScoreB?: string;
  recommendation?: string;
  trendBLabel?: string;
};

const ASSISTANT_PROMPT_TEMPLATE =
  "You are an AI market insights explainer for a vault hackathon app. " +
  "You must only explain the deterministic recommendation and onchain snapshot. " +
  "Never instruct wallet signing, never execute transactions, and never claim guaranteed returns. " +
  "Respond in 3-6 sentences of plain English.";

function buildFallbackExplanation(question: string, snapshot?: Snapshot): string {
  const rec = snapshot?.recommendation || "Hold current strategy";
  const apy = snapshot?.apy || "0.00";
  const opp = snapshot?.opportunityScore || "0.0000";
  const risk = snapshot?.riskScoreB || "0.0000";
  const trend = snapshot?.trendBLabel || "flat";
  return [
    `Question: ${question}.`,
    `Current APY is ${apy}% and the deterministic recommendation is "${rec}".`,
    `Strategy B APY trend is ${trend}, which is weighed against liquidity/utilization risk.`,
    `Opportunity score is ${opp} while risk score for Strategy B is ${risk}, so the recommendation reflects reward vs liquidity/utilization risk.`,
    "If APY, liquidity, or utilization changes onchain, the recommendation can change as well.",
    "This assistant explains conditions only and does not execute transactions."
  ].join(" ");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, snapshot } = req.body as { question: string; snapshot: Snapshot };
  if (!question) {
    return res.status(400).json({ error: "question is required" });
  }

  const key = process.env.OPENAI_API_KEY?.trim() || "";
  const isPlaceholderKey =
    !key ||
    key.toLowerCase() === "your_key" ||
    key.toLowerCase() === "your-api-key" ||
    key.toLowerCase() === "changeme";

  if (isPlaceholderKey) {
    return res.status(200).json({
      answer: buildFallbackExplanation(question, snapshot),
      source: "fallback:no_api_key"
    });
  }
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const system =
    ASSISTANT_PROMPT_TEMPLATE +
    " Mention risk drivers (utilization/liquidity), APY tradeoff, and why recommendation could change.";

  const user = `Question: ${question}\n\nOnchain Snapshot:\n- Wallet: ${snapshot?.address || "N/A"}\n- User mUSDC Balance: ${snapshot?.userBalance || "0"}\n- User Vault Balance: ${snapshot?.vaultBalance || "0"}\n- Vault Total Assets: ${snapshot?.totalAssets || "0"}\n- Current APY (%): ${snapshot?.apy || "0"}\n- Active Strategy ID: ${snapshot?.activeStrategyId ?? 0}\n- Strategy B APY Trend: ${snapshot?.trendBLabel || "flat"}\n- Opportunity Score: ${snapshot?.opportunityScore || "0.0000"}\n- Risk Score (Strategy B): ${snapshot?.riskScoreB || "0.0000"}\n- Deterministic Recommendation: ${snapshot?.recommendation || "Hold current strategy"}`;

  try {
    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.3
    });

    const answer = completion.choices[0]?.message?.content || buildFallbackExplanation(question, snapshot);
    return res.status(200).json({ answer, source: "openai" });
  } catch (error: any) {
    return res.status(200).json({
      answer: buildFallbackExplanation(question, snapshot),
      source: "fallback:openai_error",
      error: error?.message || "Assistant call failed"
    });
  }
}
