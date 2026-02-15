import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { objective, snapshot } = req.body as {
    objective?: string;
    snapshot?: { apy?: string; totalAssets?: string; userBalance?: string };
  };

  const recommendations = [
    "If APY rises and risk tolerance is unchanged, user may consider a small additional deposit.",
    "If APY drops sharply, user may review vault exposure and consider partial withdraw.",
    "If user wallet balance is near zero, suggest topping up gas before any action."
  ];

  return res.status(200).json({
    objective: objective || "No objective provided",
    snapshot: snapshot || {},
    proposedActions: recommendations,
    guardrail: "Simulation only. This endpoint never broadcasts transactions or moves funds."
  });
}
