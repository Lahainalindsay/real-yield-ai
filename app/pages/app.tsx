import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import ConnectButton from "../components/ConnectButton";
import VaultPanel from "../components/VaultPanel";
import { contractsFromProvider, resolveDeployment } from "../lib/contracts";
import { chainName, explorerBase, SUPPORTED_CHAIN_IDS, switchToSupportedChain } from "../lib/chain";
import { readSnapshot } from "../lib/onchain";

export default function AppPage() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState<number>(Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 97));
  const [amount, setAmount] = useState("1");
  const [musdcBalance, setMusdcBalance] = useState("0.0000");
  const [vaultBalance, setVaultBalance] = useState("0.0000");
  const [totalAssets, setTotalAssets] = useState("0.0000");
  const [apy, setApy] = useState("0.00");
  const [txHash, setTxHash] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txError, setTxError] = useState("");

  const wrongChain = useMemo(() => !SUPPORTED_CHAIN_IDS.includes(chainId), [chainId]);
  const preferredChain = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 97);

  async function refresh() {
    if (!provider || !address || wrongChain) return;
    try {
      const snap = await readSnapshot(provider, address, chainId);
      setMusdcBalance(snap.musdcBalance);
      setVaultBalance(snap.vaultBalance);
      setTotalAssets(snap.totalAssets);
      setApy(snap.apy);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    void refresh();
  }, [provider, address, chainId]);

  async function onConnected(p: ethers.providers.Web3Provider, addr: string, cid: number) {
    setProvider(p);
    setAddress(addr);
    setChainId(cid);

    const externalProvider = p.provider as any;
    externalProvider.on?.("chainChanged", (hexChainId: string) => {
      setChainId(parseInt(hexChainId, 16));
    });
  }

  async function withTx(fn: () => Promise<ethers.ContractTransaction>) {
    setTxStatus("pending");
    setTxHash("");
    setTxError("");
    try {
      const tx = await fn();
      setTxHash(tx.hash);
      await tx.wait();
      setTxStatus("success");
      await refresh();
    } catch (e: any) {
      setTxStatus("error");
      setTxError(e?.reason || e?.message || "Unknown error");
    }
  }

  async function approve() {
    if (!provider || !address || wrongChain) return;
    const deployment = await resolveDeployment(chainId);
    const { erc20 } = contractsFromProvider(provider, deployment);
    const parsed = ethers.utils.parseUnits(amount || "0", 18);
    await withTx(() => erc20.approve(deployment.vault, parsed));
  }

  async function deposit() {
    if (!provider || !address || wrongChain) return;
    const deployment = await resolveDeployment(chainId);
    const { vault } = contractsFromProvider(provider, deployment);
    const parsed = ethers.utils.parseUnits(amount || "0", 18);
    await withTx(() => vault.deposit(parsed));
  }

  async function withdraw() {
    if (!provider || !address || wrongChain) return;
    const deployment = await resolveDeployment(chainId);
    const { vault } = contractsFromProvider(provider, deployment);
    const parsed = ethers.utils.parseUnits(amount || "0", 18);
    await withTx(() => vault.withdraw(parsed));
  }

  async function switchChain() {
    try {
      await switchToSupportedChain(preferredChain);
      if (provider) {
        const net = await provider.getNetwork();
        setChainId(net.chainId);
      }
    } catch (e: any) {
      setTxStatus("error");
      setTxError(e?.message || "Failed to switch chain");
    }
  }

  return (
    <main className="container" style={{ marginTop: 24, marginBottom: 40 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <h1>Vault App</h1>
        <ConnectButton onConnected={onConnected} />
      </div>

      <VaultPanel
        address={address}
        chainName={chainName(chainId)}
        musdcBalance={musdcBalance}
        vaultBalance={vaultBalance}
        totalAssets={totalAssets}
        apy={apy}
        amount={amount}
        setAmount={setAmount}
        approve={approve}
        deposit={deposit}
        withdraw={withdraw}
        txHash={txHash}
        txStatus={txStatus}
        txError={txError}
        explorerBase={explorerBase(chainId)}
        switchChain={switchChain}
        wrongChain={wrongChain}
      />
    </main>
  );
}
