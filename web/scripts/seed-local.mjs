/**
 * Local fixture for the Isusu web app.
 *
 * Two modes:
 *
 *   fork (default) — deploys Isusu to a local anvil fork of BNB Chain, stubs
 *   the Agent ID contract's balanceOf at its real address, and funds test
 *   wallets by writing the real USDT balance mapping. Needs an archive RPC.
 *
 *   mocks (--mocks) — plain anvil, no upstream RPC. Deploys MockUSDT and
 *   MockAgentId from the forge artifacts, mints balances and grants Agent IDs.
 *
 * Both modes seed a few circles in different states and write .env.local.
 * Nothing in this file is used by the app at runtime.
 *
 * Usage:
 *   anvil --fork-url $BSC_ARCHIVE_RPC --chain-id 56        # fork mode
 *   node scripts/seed-local.mjs
 *
 *   anvil --chain-id 56                                    # mock mode
 *   node scripts/seed-local.mjs --mocks
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  encodeAbiParameters,
  getAddress,
  http,
  keccak256,
  padHex,
  parseEventLogs,
  parseUnits,
  toHex,
} from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const USE_MOCKS = process.argv.includes("--mocks") || process.env.USE_MOCKS === "1";
let USDT = getAddress(process.env.USDT_ADDRESS ?? "0x55d398326f99059ff775485246999027b3197955");
let AGENT_ID = getAddress(process.env.AGENT_ID_ADDRESS ?? "0x60b9262456de011f7d15a54cdd8c48baaa8b022f");
const ARTIFACT = path.join(HERE, "..", "..", "out", "Isusu.sol", "Isusu.json");
const MOCK_USDT_ARTIFACT = path.join(HERE, "..", "..", "out", "MockUSDT.sol", "MockUSDT.json");
const MOCK_AGENT_ARTIFACT = path.join(HERE, "..", "..", "out", "MockAgentId.sol", "MockAgentId.json");
const MULTICALL3_ARTIFACT = path.join(HERE, "..", "..", "out", "Multicall3Stub.sol", "Multicall3Stub.json");
const MULTICALL3 = getAddress("0xcA11bde05977b3631167028862bE2a173976CA11");
const START_BALANCE = parseUnits("100000", 18);

const transport = http(RPC_URL);
const publicClient = createPublicClient({ chain: bsc, transport });
const testClient = createTestClient({ mode: "anvil", chain: bsc, transport });

const mnemonic = "test test test test test test test test test test test junk";
const accounts = Array.from({ length: 10 }, (_, index) =>
  mnemonicToAccount(mnemonic, { addressIndex: index }),
);
const wallets = accounts.map((account) => createWalletClient({ account, chain: bsc, transport }));

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

if (!fs.existsSync(ARTIFACT)) {
  throw new Error(`Missing ${ARTIFACT}. Run "forge build" in the repo root first.`);
}

const artifact = JSON.parse(fs.readFileSync(ARTIFACT, "utf8"));
const abi = artifact.abi;

let isusu = process.env.ISUSU_ADDRESS ? getAddress(process.env.ISUSU_ADDRESS) : null;

async function send(wallet, request) {
  const hash = await wallet.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`Transaction reverted: ${hash}`);
  return receipt;
}

async function approve(index, amount) {
  return send(wallets[index], {
    address: USDT,
    abi: erc20Abi,
    functionName: "approve",
    args: [isusu, amount],
  });
}

async function circle(id) {
  return publicClient.readContract({
    address: isusu,
    abi,
    functionName: "getCircle",
    args: [BigInt(id)],
  });
}

async function createCircle(creator, contribution, roundDays, joinDays) {
  const receipt = await send(wallets[creator], {
    address: isusu,
    abi,
    functionName: "createCircle",
    args: [parseUnits(String(contribution), 18), BigInt(roundDays) * 86400n, BigInt(joinDays) * 86400n],
  });

  const [event] = parseEventLogs({ abi, eventName: "CircleCreated", logs: receipt.logs });
  return Number(event.args.id);
}

async function join(index, id, slot) {
  const view = await circle(id);
  const amount = view.contribution * BigInt(view.slots - slot + 1);
  await approve(index, amount);
  await send(wallets[index], {
    address: isusu,
    abi,
    functionName: "join",
    args: [BigInt(id), slot],
  });
}

async function contribute(index, id) {
  const view = await circle(id);
  await approve(index, view.contribution);
  await send(wallets[index], {
    address: isusu,
    abi,
    functionName: "contribute",
    args: [BigInt(id)],
  });
}

async function advance(seconds) {
  await testClient.increaseTime({ seconds });
  await testClient.mine({ blocks: 1 });
}

async function deployMocks() {
  for (const file of [MOCK_USDT_ARTIFACT, MOCK_AGENT_ARTIFACT, MULTICALL3_ARTIFACT]) {
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Run "forge build" in the repo root first.`);
  }
  const mockUsdt = JSON.parse(fs.readFileSync(MOCK_USDT_ARTIFACT, "utf8"));
  const mockAgent = JSON.parse(fs.readFileSync(MOCK_AGENT_ARTIFACT, "utf8"));
  const multicall = JSON.parse(fs.readFileSync(MULTICALL3_ARTIFACT, "utf8"));

  // The app batches reads through Multicall3 at its canonical address.
  await testClient.setCode({ address: MULTICALL3, bytecode: multicall.deployedBytecode.object });

  console.log("Deploying mock USDT and Agent ID…");

  let hash = await wallets[0].deployContract({
    abi: mockUsdt.abi,
    bytecode: mockUsdt.bytecode.object,
    args: [],
  });
  let receipt = await publicClient.waitForTransactionReceipt({ hash });
  USDT = receipt.contractAddress;

  hash = await wallets[0].deployContract({
    abi: mockAgent.abi,
    bytecode: mockAgent.bytecode.object,
    args: [],
  });
  receipt = await publicClient.waitForTransactionReceipt({ hash });
  AGENT_ID = receipt.contractAddress;

  for (let index = 0; index < accounts.length; index += 1) {
    const account = accounts[index].address;
    await send(wallets[0], {
      address: USDT,
      abi: mockUsdt.abi,
      functionName: "mint",
      args: [account, START_BALANCE],
    });
    // Accounts 8 and 9 are the "no Agent ID" demo.
    await send(wallets[0], {
      address: AGENT_ID,
      abi: mockAgent.abi,
      functionName: "setHolder",
      args: [account, index < 8],
    });
  }

  console.log(`  MockUSDT at ${USDT} (100,000 each)`);
  console.log(`  MockAgentId at ${AGENT_ID} (accounts 0-7 hold one)`);
  console.log(`  Multicall3 at ${MULTICALL3}`);
}

async function fundFromFork() {
  console.log("Funding wallets with USDT on the fork…");
  // Find the balances mapping slot by writing a marker for a probe address.
  const probe = accounts[7].address;
  let balanceSlot = null;
  for (let slot = 0; slot < 40; slot += 1) {
    const key = keccak256(
      encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [probe, BigInt(slot)]),
    );
    await testClient.setStorageAt({ address: USDT, index: key, value: padHex("0x2a", { size: 32 }) });
    const read = await publicClient.readContract({
      address: USDT,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [probe],
    });
    if (read === 42n) {
      balanceSlot = slot;
      break;
    }
    await testClient.setStorageAt({ address: USDT, index: key, value: padHex("0x0", { size: 32 }) });
  }
  if (balanceSlot === null) throw new Error("Could not find the USDT balance mapping slot.");

  for (const account of accounts) {
    const key = keccak256(
      encodeAbiParameters(
        [{ type: "address" }, { type: "uint256" }],
        [account.address, BigInt(balanceSlot)],
      ),
    );
    await testClient.setStorageAt({ address: USDT, index: key, value: toHex(START_BALANCE, { size: 32 }) });
  }
  console.log(`  USDT balances funded (mapping slot ${balanceSlot}).`);

  // Make balanceOf at the canonical Agent ID address return the sender's stored
  // balance. The runtime reads the address argument from calldata and returns
  // storage[keccak256(arg . 0)], matching a mapping(address => uint256).
  const agentStub = "0x60043560005260406000205460005260206000f3";
  await testClient.setCode({ address: AGENT_ID, bytecode: agentStub });
  for (const account of accounts) {
    const key = keccak256(
      encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [account.address, 0n]),
    );
    await testClient.setStorageAt({ address: AGENT_ID, index: key, value: padHex("0x1", { size: 32 }) });
  }
  const agentBalance = await publicClient.readContract({
    address: AGENT_ID,
    abi: [
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: [accounts[0].address],
  });
  console.log(`  Agent ID stub active (balance for account 0: ${agentBalance}).`);
  if (agentBalance !== 1n) throw new Error("Agent ID stub is not returning 1; aborting.");

  // Wallets 8 and 9 are the "no Agent ID" demo. Write an explicit zero so the
  // read is served from local fork state instead of archive storage upstream.
  for (const account of accounts.slice(8)) {
    const key = keccak256(
      encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [account.address, 0n]),
    );
    await testClient.setStorageAt({ address: AGENT_ID, index: key, value: padHex("0x0", { size: 32 }) });
  }
}

async function main() {
  const chainId = await publicClient.getChainId();
  if (chainId !== 56) throw new Error(`Expected chain 56, got ${chainId}. Start anvil with --chain-id 56.`);

  if (USE_MOCKS) {
    await deployMocks();
  } else {
    await fundFromFork();
  }

  if (!isusu) {
    console.log("Deploying Isusu…");
    const hash = await wallets[0].deployContract({
      abi,
      bytecode: artifact.bytecode.object,
      args: [USDT, AGENT_ID],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    isusu = receipt.contractAddress;
    console.log(`  Isusu deployed at ${isusu}`);
  } else {
    console.log(`Using existing Isusu at ${isusu}`);
  }

  console.log("Seeding circles…");

  // 1. Open, 3 of 5. 1 USDT, weekly, one week to fill.
  const open5 = await createCircle(0, 1, 7, 7);
  await join(0, open5, 1);
  await join(1, open5, 2);
  await join(2, open5, 3);

  // 2. Open, 4 of 5. 2 USDT, every three days.
  const openFour = await createCircle(3, 2, 3, 7);
  const fourPlayers = [3, 4, 5, 6];
  for (let index = 0; index < fourPlayers.length; index += 1) {
    await join(fourPlayers[index], openFour, index + 1);
  }

  // 3. Active, round 2, two late seats. 2 USDT, daily rounds.
  const late = await createCircle(5, 2, 1, 7);
  await join(5, late, 1);
  await join(6, late, 2);
  await join(7, late, 3);
  await join(0, late, 4);
  await join(1, late, 5);
  await contribute(5, late);
  await contribute(6, late);
  await contribute(0, late);

  // 4. Past its join deadline, never filled. 2 of 5. 1 USDT, weekly.
  const expired = await createCircle(2, 1, 7, 1);
  await join(2, expired, 1);
  await join(3, expired, 2);

  // 5. Completed, with one default before payout and compensation at the end.
  const completed = await createCircle(4, 1, 1, 3);
  await join(4, completed, 1);
  await join(5, completed, 2);
  await join(6, completed, 3);
  await join(7, completed, 4);
  await join(0, completed, 5);
  // Round 2: seat 5 never pays.
  await contribute(4, completed);
  await contribute(5, completed);
  await contribute(6, completed);
  await contribute(7, completed);
  await advance(2 * 86400 + 3600);
  await send(wallets[2], {
    address: isusu,
    abi,
    functionName: "closeRound",
    args: [BigInt(completed)],
  });
  // Rounds 3, 4 and 5 paid by the four remaining seats.
  for (let round = 0; round < 3; round += 1) {
    await contribute(4, completed);
    await contribute(5, completed);
    await contribute(6, completed);
    await contribute(7, completed);
  }
  await send(wallets[4], {
    address: isusu,
    abi,
    functionName: "withdraw",
    args: [BigInt(completed)],
  });

  // 6. Cancelled after missing its deadline. One refund left unclaimed.
  const cancelled = await createCircle(2, 1, 3, 1);
  await join(2, cancelled, 1);
  await join(3, cancelled, 2);
  await advance(2 * 86400);
  await send(wallets[4], {
    address: isusu,
    abi,
    functionName: "cancelCircle",
    args: [BigInt(cancelled)],
  });
  await send(wallets[2], {
    address: isusu,
    abi,
    functionName: "withdraw",
    args: [BigInt(cancelled)],
  });

  const envPath = path.join(HERE, "..", ".env.local");
  const env = [
    `NEXT_PUBLIC_ISUSU_ADDRESS=${isusu}`,
    `NEXT_PUBLIC_USDT_ADDRESS=${USDT}`,
    `NEXT_PUBLIC_AGENT_ID_ADDRESS=${AGENT_ID}`,
    "NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545",
    "NEXT_PUBLIC_LOGO_DEV_TOKEN=",
    "",
  ].join("\n");
  fs.writeFileSync(envPath, env);

  console.log("\nSeeded:");
  console.log(`  open 3/5, 1 USDT     #${open5}  /pools/${open5}`);
  console.log(`  open 4/5, 2 USDT     #${openFour}  /pools/${openFour}`);
  console.log(`  active, late seats   #${late}  /pools/${late}`);
  console.log(`  deadline passed      #${expired}  /pools/${expired}`);
  console.log(`  completed + default  #${completed}  /pools/${completed}`);
  console.log(`  cancelled + refund   #${cancelled}  /pools/${cancelled}`);
  console.log(`\nWrote ${envPath}`);
  console.log("Wallets (anvil):");
  accounts.slice(0, 5).forEach((account, index) => console.log(`  ${index}: ${account.address}`));
}

main().catch((error) => {
  console.error("\nSeed failed:", error.shortMessage ?? error.message ?? error);
  process.exitCode = 1;
});
