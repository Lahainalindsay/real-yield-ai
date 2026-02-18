# real-bnb-vault

A verifiable, deterministic DeFi agent stack for hackathon demo and judging.

## One-Line Pitch
**Deterministic onchain logic decides, AI explains, artifacts prove.**

## Why This Project Is Compelling
- **Verifiable agent workflow:** Every run produces reproducible JSON artifacts and explorer-verifiable tx links.
- **Deterministic scoring core:** Opportunity, risk, and confidence are computed from explicit rules.
- **Explainability layer:** AI translates deterministic outputs into plain language for operators and judges.
- **Working end-to-end demo:** Connect wallet, read onchain metrics, run vault actions, inspect proof/history.

## What Is Implemented Today
### Frontend
- `/` landing page with clear product narrative and artifact links.
- `/app` vault console:
  - Connect wallet
  - Approve / Deposit / Withdraw
  - Deterministic decision display
  - Deployment + proof artifacts
- `/yield` strategy intelligence:
  - Deterministic strategy scoring table
  - Recommendation framing (opportunity/risk/confidence)
  - Assistant-ready context

### Backend / API
- `/api/assistant`:
  - Uses OpenAI when key is valid
  - Automatically falls back to deterministic local explanation when key is missing/placeholder/invalid
- `/api/autonomous-action`:
  - Returns simulation-only proposed actions (`GET` and `POST`)

### Smart Contracts / Scripts
- `ERC20Mock` (`mUSDC`)
- `YieldOracleMock`
- `StrategyManager`
- `Vault`
- Hardhat scripts for deploy, proof tx, deterministic agent run, verification

## Judge-First Architecture
1. **Onchain state read** (`readSnapshot`)
2. **Deterministic scoring** (opportunity/risk/confidence)
3. **Recommendation + reason flags**
4. **Artifact export** (`deployments/*.json`, proof + decision logs)
5. **AI explanation** mapped to deterministic outputs

## Repository Layout
```text
real-bnb-vault/
├── app/                 # Next.js frontend + API routes
├── contracts/           # Hardhat + Solidity contracts/scripts/tests
├── deployments/         # Canonical artifact outputs (addresses/proof/decision history)
├── AI_BUILD_LOG.md      # Build log and implementation notes
└── README.md
```

## Quick Start
```bash
npm install
cp contracts/.env.example contracts/.env
cp app/.env.local.example app/.env.local
```

Set required values:

- `contracts/.env`
  - `PRIVATE_KEY`
  - `BSC_TESTNET_RPC_URL`
  - Optional explorer keys

- `app/.env.local`
  - `NEXT_PUBLIC_DEFAULT_CHAIN_ID=97`
  - Optional explicit contract addresses (otherwise loaded from public deployments JSON)
  - `OPENAI_API_KEY` (optional; fallback mode works without it)

## Run Locally
```bash
npm run dev
```
Open:
- `http://localhost:3000/`
- `http://localhost:3000/app`
- `http://localhost:3000/yield`

## Deploy + Generate Proof (BSC Testnet)
```bash
npm run deploy:bscTestnet
cd contracts
npx hardhat run scripts/proofTx.ts --network bscTestnet
cd ..
npm run run-agent:bscTestnet
```

Generated evidence:
- `deployments/97.json`
- `deployments/proof-97.json`
- `deployments/decision-log-97.json`
- `deployments/decision-history-97.json`
- mirrored files under `app/public/deployments/`

## 2-Minute Judge Demo Script
1. Open `/app` and connect wallet.
2. Show network check + live balances/APY.
3. Execute a testnet action (approve/deposit/withdraw).
4. Open proof and deployment links (explorer verification).
5. Show decision timeline and reason flags.
6. Open `/yield` and show deterministic ranking table.
7. Ask assistant: “Why is this the top strategy right now?”
8. Show that response is grounded in deterministic snapshot data.

## Key Artifact Files for Judging
- `app/public/deployments/97.json`
- `app/public/deployments/proof-97.json`
- `app/public/deployments/decision-log-97.json`
- `app/public/deployments/decision-history-97.json`

## Mainnet Path (Post-Hackathon)
- Protocol-specific risk adaptors
- Monitoring + alerting
- Governance-bound execution policies
- Formalized policy constraints and production hardening

## Notes
- Testnet/demo project: no guaranteed returns.
- Assistant explains, but does not sign or execute wallet transactions.
