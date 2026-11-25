# Isusu web

The interface for Isusu: rotating savings circles (ajo/esusu) that settle in USDT on BNB Chain.
Next.js App Router, TypeScript, Tailwind, viem and React Query.

The app is read-only. It never connects a wallet. Every circle, seat and amount comes from the
contract, and the page refreshes as new blocks arrive.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Environment (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_ISUSU_ADDRESS` | The Isusu circle contract. Leave zero to show the empty state. |
| `NEXT_PUBLIC_USDT_ADDRESS` | USDT on BNB Chain (`0x55d398…7955`, 18 decimals). |
| `NEXT_PUBLIC_RPC_URL` | Chain 56 RPC. Use `http://127.0.0.1:8545` with a local chain. |
| `NEXT_PUBLIC_LOGO_DEV_TOKEN` | Optional Logo.dev token for the USDT and BNB Chain marks. |

Without a token, both marks fall back to local SVGs.

`npm run build` / `npm start` for a production build. `npm run shots` writes Playwright screenshots
at 390, 768 and 1280 px to `screenshots/` and fails on horizontal overflow (the app must be running;
set `BASE_URL`, `SHOT_PATHS`, `SHOT_WIDTHS` or `CHROME_PATH` to override).

## Agent actions

There are no wallet connection buttons. Each action exposes a copyable request: join,
contribute, create and withdraw. Paste it into your agent, which previews each step, shows the
amounts and waits for confirmation. This needs Developer Mode on in the Binance App.

Requests always approve the exact USDT amount for that action, never an unlimited allowance.

## Local chain

The app talks to a real deployment. Seed scripts live in `scripts/` as dev tooling and are never
imported by the app.

**Mocks (no upstream RPC):**

```bash
# from the repository root
forge build

# anywhere, in another terminal
anvil --chain-id 56

# in web/
npm run local:seed:mock
```

This deploys `MockUSDT`, `MockAgentId` and a minimal Multicall3 from the forge artifacts, mints
100,000 USDT per account and gives wallets 0 to 7 an Agent ID.

**Fork (real USDT and Agent ID addresses):**

```bash
# from the repository root
forge build
anvil --fork-url $BSC_ARCHIVE_RPC --fork-block-number <pinned> --chain-id 56

# in web/
npm run local:seed
```

Fork mode needs an archive RPC: it funds accounts by writing Tether's balance mapping and stubs the
Agent ID `balanceOf` at the canonical address.

Both modes deploy `out/Isusu.sol/Isusu.json`, seed circles in every state and write `.env.local`.
The seed is a fixture only; none of it ships in the app.

## Product rules that are easy to break

- Exact-amount USDT approvals only, never unlimited.
- Circles are fixed at five seats, 1 or 2 USDT per round, with 1, 3 or 7 day rounds and join windows.
- Joining needs an Agent ID; the copy points to Binance App, Wallet, homepage banner, Agent ID.
- Payouts are automatic. Only refunds and held payouts use `withdraw`.
- If a payout transfer fails, the contract holds it as a withdrawable balance for that member.
- Language stays plain: no "earn", "yield", "profit" or "passive income".
- The product is Isusu, built on BNB Chain. Never brand it as Binance or BNB.
