import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";

export const metadiumTestnet = defineChain({
  id: 12,
  name: "Metadium Testnet",
  nativeCurrency: { name: "META", symbol: "META", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.metadium.com/dev"] },
  },
  blockExplorers: {
    default: {
      name: "Metadium Explorer",
      url: "https://testnetexplorer.metadium.com",
    },
  },
});

export const config = createConfig({
  chains: [metadiumTestnet],
  connectors: [injected()],
  transports: {
    [metadiumTestnet.id]: http(),
  },
});
