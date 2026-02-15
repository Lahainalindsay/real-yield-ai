import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type Snapshot = {
  address?: string;
  userBalance?: string;
  vaultBalance?: string;
  totalAssets?: string;
  apy?: string;
};

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
    "You are a vault explainer assistant for a hackathon demo. " +
    "Use provided onchain snapshot only. " +
    "AI explains, does not transact, does not execute funds movement, and does not promise returns.";

  const user = `Question: ${question}\n\nOnchain Snapshot:\n- Wallet: ${snapshot?.address || "N/A"}\n- User mUSDC Balance: ${snapshot?.userBalance || "0"}\n- User Vault Balance: ${snapshot?.vaultBalance || "0"}\n- Vault Total Assets: ${snapshot?.totalAssets || "0"}\n- Current APY (%): ${snapshot?.apy || "0"}\n\nRespond in plain English with concise bullets.`;

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
