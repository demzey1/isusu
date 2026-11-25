import { createPublicClient, http } from "viem";
import { bsc } from "viem/chains";

import { RPC_URL } from "./config";

/** Read-only chain access. The app never connects to a wallet. */
export const publicClient = createPublicClient({
  chain: bsc,
  transport: http(RPC_URL),
});
