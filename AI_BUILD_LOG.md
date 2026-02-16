# AI_BUILD_LOG.md

## Project
real-yield-ai (Good Vibes Only: OpenClaw Edition)

## Prompt History
1. "Create a complete working monorepo named `real-bnb-vault`..."
2. "Add this exact submission checklist block to README..."
3. "You are continuing work in an EXISTING codebase..." (current refactor prompt for BNB + market insights agent + AI explainer)

## What AI Generated
- Contract scaffold and HH2 TypeScript setup
- Frontend pages/components for landing, app, and yield
- API assistant route using OpenAI
- Deployment/proof scripts and base README
- Refactor patches for strategy-manager/agent flow and deterministic decision logging

## Manual Changes Performed
- Added `StrategyManager.sol` (onchain metrics registry)
- Extended `Vault.sol` with `activeStrategyId`, `AGENT_ROLE`, and `setActiveStrategy`
- Updated deploy script to deploy 4 contracts + seed strategies + set initial strategy
- Added deterministic `runAgentOnce.ts` with decision criteria and JSON log output
- Updated frontend onchain snapshot reads to include strategy metrics and strategy ID
- Added `/app` decision-log display with explorer tx link
- Added `/yield` strategy table, deterministic score calculation, recommendation block
- Tightened assistant constraints to explanation-only behavior (no transaction execution)

## Assistant Prompt Template Reference
- File: `app/pages/api/assistant.ts`
- Constant: `ASSISTANT_PROMPT_TEMPLATE`
- Guardrail summary:
  - Explain only
  - No transaction execution/signing instructions
  - No guaranteed return claims
  - 3-6 sentence response length

## Architecture Decisions
- Keep deterministic scoring onchain-data-driven and reproducible
- Keep autonomous behavior optional and explicit (`runAgentOnce.ts`)
- Store machine-readable logs in `deployments/decision-log-<chainId>.json`
- Preserve existing app structure; apply minimal patches rather than replacing pages

## Safety and Compliance
- No token launch mechanics
- No fundraising modules
- No auto-executed fund movement in AI assistant API
- Onchain proof and decision artifacts written to versioned JSON outputs
