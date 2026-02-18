import { useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { Button } from "./ui/Button";

type LegacyProps = {
  onConnected: (provider: ethers.providers.Web3Provider, address: string, chainId: number) => void;
};

type UiProps = {
  connected: boolean;
  label: string;
  onClick: () => Promise<void> | void;
};

type Props = LegacyProps | UiProps;

function isLegacyProps(props: Props): props is LegacyProps {
  return "onConnected" in props;
}

export default function ConnectButton(props: Props) {
  const [label, setLabel] = useState("Connect Wallet");

  if (!isLegacyProps(props)) {
    return (
      <Button variant={props.connected ? "success" : "primary"} onClick={props.onClick}>
        {props.label}
      </Button>
    );
  }
  const legacyProps = props;

  async function connect() {
    try {
      const web3Modal = new Web3Modal({ cacheProvider: true });
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      setLabel(`${address.slice(0, 6)}...${address.slice(-4)}`);
      legacyProps.onConnected(provider, address, network.chainId);
    } catch (err) {
      console.error(err);
      setLabel("Connect Wallet");
    }
  }

  return (
    <Button variant="primary" onClick={connect} type="button">
      {label}
    </Button>
  );
}
