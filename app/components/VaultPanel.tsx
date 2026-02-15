import { ethers } from "ethers";

type Props = {
  address: string;
  chainName: string;
  musdcBalance: string;
  vaultBalance: string;
  totalAssets: string;
  apy: string;
  amount: string;
  setAmount: (v: string) => void;
  approve: () => Promise<void>;
  deposit: () => Promise<void>;
  withdraw: () => Promise<void>;
  txHash: string;
  txStatus: "idle" | "pending" | "success" | "error";
  txError: string;
  explorerBase: string;
  switchChain: () => Promise<void>;
  wrongChain: boolean;
};

export default function VaultPanel(props: Props) {
  const {
    address,
    chainName,
    musdcBalance,
    vaultBalance,
    totalAssets,
    apy,
    amount,
    setAmount,
    approve,
    deposit,
    withdraw,
    txHash,
    txStatus,
    txError,
    explorerBase,
    switchChain,
    wrongChain
  } = props;

  return (
    <div className="card">
      <h2>Vault Dashboard</h2>
      <p className="muted" style={{ marginTop: 8 }}>Wallet: {address || "Not connected"}</p>
      <p className="muted">Network: {chainName}</p>

      {wrongChain && (
        <div style={{ marginTop: 12 }}>
          <p className="tx-err">Wrong network. Please switch to BSC Testnet (97) or opBNB Testnet (5611).</p>
          <button className="btn btn-secondary" onClick={switchChain} style={{ marginTop: 10 }}>
            Switch Network
          </button>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card"><p>mUSDC Balance</p><h3>{musdcBalance}</h3></div>
        <div className="card"><p>Your Vault Balance</p><h3>{vaultBalance}</h3></div>
        <div className="card"><p>Total Assets</p><h3>{totalAssets}</h3></div>
        <div className="card"><p>Current APY</p><h3>{apy}%</h3></div>
      </div>

      <div style={{ marginTop: 18 }}>
        <label htmlFor="amount">Amount (mUSDC)</label>
        <input
          id="amount"
          className="input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1.0"
          inputMode="decimal"
        />
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn btn-secondary" onClick={approve}>Approve</button>
        <button className="btn btn-primary" onClick={deposit}>Deposit</button>
        <button className="btn btn-secondary" onClick={withdraw}>Withdraw</button>
      </div>

      <div style={{ marginTop: 14 }}>
        <p>Tx status: {txStatus}</p>
        {txHash && (
          <p>
            Tx hash: <a target="_blank" rel="noreferrer" href={`${explorerBase}/tx/${txHash}`}>{txHash}</a>
          </p>
        )}
        {txStatus === "success" && <p className="tx-ok">Transaction confirmed.</p>}
        {txStatus === "error" && <p className="tx-err">Error: {txError}</p>}
      </div>
    </div>
  );
}
