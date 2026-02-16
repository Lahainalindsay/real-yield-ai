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
};

const ASSISTANT_PROMPT_TEMPLATE =
  "You are an AI market insights explainer for a vault hackathon app. " +
  "You must only explain the deterministic recommendation and onchain snapshot. " +
  "Never instruct wallet signing, never execute transactions, and never claim guaranteed returns. " +
  "Respond in 3-6 sentences of plain English.";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, snapshot } = req.body as { question: string; snapshot: Snapshot };
  if (!question) {
    return res.status(400).json({ error: "question is required" });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(200).json({
      answer:
        "OPENAI_API_KEY not configured. Snapshot summary: APY " +
        `${snapshot?.apy || "0.00"}% with user balance ${snapshot?.userBalance || "0.0000"} mUSDC.`
    });
  }

  const client = new OpenAI({ apiKey: key });
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const system =
    ASSISTANT_PROMPT_TEMPLATE +
    " Mention risk drivers (utilization/liquidity), APY tradeoff, and why recommendation could change.";

  const user = `Question: ${question}\n\nOnchain Snapshot:\n- Wallet: ${snapshot?.address || "N/A"}\n- User mUSDC Balance: ${snapshot?.userBalance || "0"}\n- User Vault Balance: ${snapshot?.vaultBalance || "0"}\n- Vault Total Assets: ${snapshot?.totalAssets || "0"}\n- Current APY (%): ${snapshot?.apy || "0"}\n- Active Strategy ID: ${snapshot?.activeStrategyId ?? 0}\n- Opportunity Score: ${snapshot?.opportunityScore || "0.0000"}\n- Risk Score (Strategy B): ${snapshot?.riskScoreB || "0.0000"}\n- Deterministic Recommendation: ${snapshot?.recommendation || "Hold current strategy"}`;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.3
    });

    const answer = completion.choices[0]?.message?.content || "No response";
    return res.status(200).json({ answer });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Assistant call failed" });
  }
}
