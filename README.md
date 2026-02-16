# real-yield-ai

Good Vibes Only: OpenClaw Edition MVP.

## Overview
This repo delivers:
- Landing page with full-screen hero + overlay CTAs
- Vault app (`/app`) for wallet connect, approve/deposit/withdraw, strategy state
- Yield insights page (`/yield`) for APY + strategy metrics + deterministic recommendation
- AI assistant API (`/api/assistant`) that explains decisions from onchain snapshot data
- Hardhat v2 + TypeScript contracts on BSC Testnet / opBNB Testnet

## Compliance Notes
- Onchain proof: contract addresses and tx hashes are written to `deployments/*.json`
- Reproducible: public repo + setup + run instructions in this README
- AI-first: `AI_BUILD_LOG.md` documents prompts, outputs, edits, decisions
- No token launch/fundraising: no liquidity launch, no airdrop pumping, no fundraising logic

## Tech Stack
- Hardhat v2 + TypeScript
- Solidity `0.8.20`
- OpenZeppelin contracts
- Next.js pages router + ethers v5 + Web3Modal

## Contracts
- `ERC20Mock` (`mUSDC`, mintable by owner)
- `YieldOracleMock` (`currentAPYBps`, owner updatable)
- `StrategyManager` (onchain strategy metrics registry)
- `Vault` (deposit/withdraw + `activeStrategyId` + owner/agent strategy switch)

## Network Config
Default: **BSC Testnet**
- Chain ID: `97`
- RPC: `https://data-seed-prebsc-1-s1.bnbchain.org:8545`
- Explorer: `https://testnet.bscscan.com`

Optional: **opBNB Testnet**
- Chain ID: `5611`
- RPC: `https://opbnb-testnet-rpc.bnbchain.org`
- Explorer: `https://testnet.opbnbscan.com`

## Setup
```bash
npm install
cp contracts/.env.example contracts/.env
cp app/.env.local.example app/.env.local
```

Set `contracts/.env`:
- `PRIVATE_KEY`
- `BSCSCAN_API_KEY`
- `OPBNBSCAN_API_KEY`
- `BSC_TESTNET_RPC_URL`
- `OPBNB_TESTNET_RPC_URL`

Set `app/.env.local`:
- `NEXT_PUBLIC_DEFAULT_CHAIN_ID` (`97` recommended)
- `NEXT_PUBLIC_ERC20_ADDRESS` (optional if loading `public/deployments/<chainId>.json`)
- `NEXT_PUBLIC_VAULT_ADDRESS` (optional)
- `NEXT_PUBLIC_YIELD_ORACLE_ADDRESS` (optional)
- `NEXT_PUBLIC_STRATEGY_MANAGER_ADDRESS` (optional)
- `OPENAI_API_KEY`
- `AI_MODEL` (optional)

## Compile and Test
```bash
npm run test
npm run build
```

## Deploy (BSC Testnet)
```bash
npm run deploy:bscTestnet
```
Writes:
- `deployments/97.json`
- `app/public/deployments/97.json`

## Produce Onchain Proof
Proof deposit tx:
```bash
cd contracts
npx hardhat run scripts/proofTx.ts --network bscTestnet
```
Writes:
- `deployments/proof-97.json`

Run deterministic agent once:
```bash
cd ..
npm run run-agent:bscTestnet
```
Writes:
- `deployments/decision-log-97.json`
- `app/public/deployments/decision-log-97.json`

## Run Frontend
```bash
npm run dev
```
Open:
- `http://localhost:3000/`
- `http://localhost:3000/app`
- `http://localhost:3000/yield`

## Verify Contracts
```bash
cd contracts
npx hardhat run scripts/verify.ts --network bscTestnet
# or
npx hardhat run scripts/verify.ts --network opBnbTestnet
```

## Testnet BNB
Use the official BNB Chain testnet faucet and docs for the current faucet URL.

## Where Submission Evidence Lives
- Contract addresses: `deployments/97.json` (or `deployments/5611.json`)
- Deposit proof tx hash: `deployments/proof-97.json` (or `proof-5611.json`)
- Agent action tx hash: `deployments/decision-log-97.json` (or `decision-log-5611.json`)

## No Token Launch Policy
This project does not include token launch, LP bootstrap, fundraising, or airdrop mechanics.

## Good Vibes Only: OpenClaw Edition Submission Checklist

Track Selected:
☑ DeFi
☑ Agent (AI explains and analyzes onchain state)

🔗 Repo

GitHub: https://github.com/Lahainalindsay/real-yield-ai

🌐 Demo

Live Demo Link: (Add Vercel/Netlify link here)

⛓ Onchain Proof (BNB Testnet)

Network: BSC Testnet (Chain ID 97)

Vault Contract Address: TBD

Mock USDC Address: TBD

Yield Oracle Address: TBD

Proof Deposit Transaction Hash: TBD

🤖 AI Build Log

See: AI_BUILD_LOG.md

Documents:

Prompts used

AI-generated code

Manual modifications

Architecture decisions

🧪 Reproducibility

To reproduce locally:

```bash
git clone https://github.com/Lahainalindsay/real-yield-ai.git
cd real-yield-ai
npm install
npm run deploy:bscTestnet
npm run dev
```
