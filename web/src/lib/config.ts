import { createConfig, http } from "wagmi";
import { bsc } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://bsc-rpc.publicnode.com";

export const ISUSU_ADDRESS = (process.env.NEXT_PUBLIC_ISUSU_ADDRESS ?? ZERO) as `0x${string}`;
export const USDT_ADDRESS = (process.env.NEXT_PUBLIC_USDT_ADDRESS ??
  "0x55d398326f99059ff775485246999027b3197955") as `0x${string}`;
export const AGENT_ID_ADDRESS = (process.env.NEXT_PUBLIC_AGENT_ID_ADDRESS ??
  "0x60b9262456de011f7d15a54cdd8c48baaa8b022f") as `0x${string}`;

export const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

export const isConfigured = ISUSU_ADDRESS !== ZERO;

export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: [injected()],
  transports: {
    [bsc.id]: http(RPC_URL),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
