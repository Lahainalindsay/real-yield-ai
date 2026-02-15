# AI_BUILD_LOG.md

## Project
real-bnb-vault (Good Vibes Only: OpenClaw Edition)

## How AI was used
This repo was generated with AI-assisted scaffolding and manual engineering review.

## Key prompts used
1. "Create a complete Hardhat + Next.js monorepo for a vault MVP on BSC testnet."
2. "Implement ERC20Mock, Vault, YieldOracleMock with deploy scripts and tests."
3. "Build landing, app, and yield pages with wallet connect and tx status handling."
4. "Add AI assistant API route that explains onchain values, but never transacts."
5. "Add autonomous action stub that proposes actions only, no auto-execution."

## What AI generated
- Initial file/folder scaffold
- Solidity contracts and baseline tests
- Hardhat scripts for deploy/seed/verify/proof tx
- Next.js pages/components for landing/app/yield
- API endpoints (`/api/assistant`, `/api/autonomous-action`)
- README baseline with runbook

## Manual edits and decisions
- Hardened chain mismatch UX and switch/add-chain handling
- Enforced explicit guardrail prompt: AI explains only, does not transact
- Added snapshot-driven assistant payload (balance, vault assets, APY)
- Added proof tx recorder output (`deployments/proof-<chainId>.json`)
- Improved copy for hackathon compliance and submission checklist

## AI in frontend assistant logic
- `app/pages/yield.tsx` gathers onchain snapshot values and sends them to `/api/assistant`
- `app/pages/api/assistant.ts` combines question + snapshot in a constrained system prompt
- Guardrail includes: no transaction execution, no financial guarantees, educational explanation only

## Safety posture
- No private key in frontend
- No autonomous fund movement
- Optional autonomous endpoint returns suggested actions only

## Residual limitations
- Oracle APY is mock-admin-set (demo)
- Chart history is static demo data unless replaced with indexed historical source
