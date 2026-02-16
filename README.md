# real-bnb-vault

Good Vibes Only: OpenClaw Edition submission.

Track suggestion: **DeFi + Agent (AI explains onchain state)**

## What this is
A reproducible monorepo MVP with:
- Landing page (`/`) for Real BNB Vault
- Vault dApp (`/app`) with wallet connect, network checks, approve/deposit/withdraw
- Yield page (`/yield`) with APY read, 7-day chart, and AI assistant panel
- Solidity contracts on BSC Testnet or opBNB Testnet

## Hackathon Compliance
- Onchain proof required: deploy + deposit tx hash recorded in `deployments/proof-<chainId>.json`
- Reproducible: public repo + demo link + setup instructions in this README
- AI-first: AI build process documented in `AI_BUILD_LOG.md`
- No token launch/fundraising mechanics: no liquidity launch, no airdrop pumping, no fundraising module

## Monorepo Structure
- `contracts`: Hardhat + Solidity + tests + deploy scripts
- `app`: Next.js frontend + API assistant routes
- `deployments`: chain outputs and proof tx hash records

## Prerequisites
- Node.js 18+
- npm 9+
- A funded test wallet (BSC testnet BNB)

## Install
```bash
npm install
```

## Environment Setup

### 1) Contracts env
```bash
cp contracts/.env.example contracts/.env
```
Set:
- `PRIVATE_KEY` (deployer wallet private key)
- `BSCSCAN_API_KEY` (optional, for verify)
- `BSC_TESTNET_RPC_URL` (defaults already provided)
- `OPBNB_TESTNET_RPC_URL` (defaults already provided)

### 2) App env
```bash
cp app/.env.local.example app/.env.local
```
Set:
- `NEXT_PUBLIC_DEFAULT_CHAIN_ID` (`97` or `5611`)
- `NEXT_PUBLIC_VAULT_ADDRESS`
- `NEXT_PUBLIC_ERC20_ADDRESS`
- `NEXT_PUBLIC_YIELD_ORACLE_ADDRESS`
- `OPENAI_API_KEY`
- `AI_MODEL` (optional, defaults to `gpt-4o-mini`)

## Compile + Test
```bash
npm run test
```

## Deploy (BSC Testnet default)
```bash
npm run deploy:bscTestnet
```
This deploys:
- `ERC20Mock` (mUSDC)
- `YieldOracleMock`
- `Vault`

And writes:
- `deployments/97.json`
- `app/public/deployments/97.json`

## Deploy (opBNB Testnet)
```bash
npm run deploy:opBnbTestnet
```
Writes:
- `deployments/5611.json`
- `app/public/deployments/5611.json`

## Onchain Proof Transaction
Run the proof script (example BSC testnet):
```bash
cd contracts
npx hardhat run scripts/proofTx.ts --network bscTestnet
```
This executes an onchain flow:
1. Approve `1 mUSDC` to vault
2. Deposit `1 mUSDC`
3. Writes tx hashes to `deployments/proof-97.json`

For opBNB:
```bash
npx hardhat run scripts/proofTx.ts --network opBnbTestnet
```
Writes `deployments/proof-5611.json`.

## Run App
```bash
npm run dev
```
Open:
- `http://localhost:3000/` landing page
- `http://localhost:3000/app` vault app
- `http://localhost:3000/yield` yield + AI assistant

## Network Info
Default: **BSC Testnet**
- Chain ID: `97`
- RPC: `https://data-seed-prebsc-1-s1.bnbchain.org:8545`
- Explorer: `https://testnet.bscscan.com`

Optional: **opBNB Testnet**
- Chain ID: `5611`
- RPC: `https://opbnb-testnet-rpc.bnbchain.org`

## Testnet BNB Faucet
- BNB Chain official faucet portal (search: "BNB testnet faucet")
- Bridge/faucet sources vary; use official BNB docs for current source

## Contract Addresses (fill after deploy)
BSC Testnet (`deployments/97.json`):
- ERC20 (mUSDC): `TBD`
- Vault: `TBD`
- YieldOracleMock: `TBD`

opBNB Testnet (`deployments/5611.json`):
- ERC20 (mUSDC): `TBD`
- Vault: `TBD`
- YieldOracleMock: `TBD`

## Proof Tx Hash (fill after proof run)
- BSC Testnet proof tx hash: `TBD` (see `deployments/proof-97.json`)
- opBNB Testnet proof tx hash: `TBD` (see `deployments/proof-5611.json`)

## Demo Link / Video Checklist
- [ ] Deployed contracts shown on explorer
- [ ] Proof tx hash shown on explorer
- [ ] Landing page UX walkthrough
- [ ] `/app` approve/deposit/withdraw success flow
- [ ] `/yield` APY + chart + assistant Q&A
- [ ] AI safety note: explains only, does not transact
- [ ] Public repo URL added
- [ ] Demo video URL added

Demo URL: `TBD`
Video URL: `TBD`

## Verify Contracts (optional)
```bash
cd contracts
npx hardhat run scripts/verify.ts --network bscTestnet
```

## Submission Checklist
- [x] Onchain contracts + vault transactions
- [x] Frontend dApp + AI assistant endpoint
- [x] AI Build Log included
- [x] Reproducible setup instructions
- [x] No token launch/fundraising mechanics

🚀 Good Vibes Only: OpenClaw Edition Submission Checklist

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

git clone https://github.com/Lahainalindsay/real-yield-ai.git
cd real-yield-ai
npm install
npm run deploy:bscTestnet
npm run dev
