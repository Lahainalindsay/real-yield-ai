import { useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";

type Props = {
  onConnected: (provider: ethers.providers.Web3Provider, address: string, chainId: number) => void;
};

export default function ConnectButton({ onConnected }: Props) {
  const [label, setLabel] = useState("Connect Wallet");

  async function connect() {
    try {
      const web3Modal = new Web3Modal({ cacheProvider: true });
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      setLabel(`${address.slice(0, 6)}...${address.slice(-4)}`);
      onConnected(provider, address, network.chainId);
    } catch (err) {
      console.error(err);
      setLabel("Connect Wallet");
    }
  }

  return (
    <button className="btn btn-primary" onClick={connect} type="button">
      {label}
    </button>
  );
}
