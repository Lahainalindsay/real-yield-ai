import type { AppProps } from "next/app";
import Navbar from "../components/Navbar";
import { appBackgroundStyle } from "../lib/backgroundConfig";
import "../styles.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div style={{ minHeight: "100vh", ...appBackgroundStyle() }}>
      <Navbar />
      <Component {...pageProps} />
    </div>
  );
}
