# Isusu web

The interface for Isusu: rotating savings circles (ajo/esusu) that settle in USDT on BNB Chain.
Next.js App Router, TypeScript, Tailwind, wagmi + viem. All numbers and seats come straight from the
contract; there is no mock data in the app.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Environment (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_ISUSU_ADDRESS` | The Isusu circle contract. |
| `NEXT_PUBLIC_USDT_ADDRESS` | USDT on BNB Chain (`0x55d398…7955`, 18 decimals). |
| `NEXT_PUBLIC_AGENT_ID_ADDRESS` | Agent ID contract, used to gate create/join. |
| `NEXT_PUBLIC_RPC_URL` | Chain 56 RPC. Use `http://127.0.0.1:8545` with the local fork. |
| `NEXT_PUBLIC_LOGO_DEV_TOKEN` | Optional publishable Logo.dev token for the USDT mark. |

`npm run build` / `npm start` for a production build. `npm run shots` writes Playwright screenshots
at 390, 768 and 1280 px to `screenshots/` and fails loudly on horizontal overflow (the app must be
running; set `BASE_URL`, `SHOT_PATHS`, `SHOT_WIDTHS` or `CHROME_PATH` to override).

## Local chain

The app talks to a real deployment. There are two local modes.

**Mocks (no upstream RPC):**

```bash
# from the repository root
forge build

# anywhere, in another terminal
anvil --chain-id 56

# in web/
npm run local:seed:mock
```

This deploys `MockUSDT`, `MockAgentId` and a minimal Multicall3 from the forge artifacts (plain
anvil has none of them), mints 100,000 USDT per account, gives wallets 0–7 an Agent ID, and wraps
up with the same seed data as the fork mode.

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

Both modes deploy `out/Isusu.sol/Isusu.json`, seed circles in every state (filling, expired, active
with late seats, completed with a default, cancelled with an unclaimed refund), and write
`.env.local`. The seed is a fixture only; none of it ships in the app.

The seed moves chain time forward, so countdowns follow chain time rather than the laptop clock.
Restart anvil and re-seed to reset every state.

## Product rules that are easy to break

- Exact-amount USDT approvals only, never unlimited. Every transaction shows its amounts first.
- Circles are fixed at five seats, 1 or 2 USDT per round, with 1, 3 or 7 day rounds and join windows.
- Joining needs an Agent ID; the copy points to Binance app → Wallet → homepage banner → Agent ID.
- Payouts are automatic. There is no "claim payout" action; only refunds and held payouts use `withdraw`.
- If a payout transfer fails, the contract holds it as a withdrawable balance for that member.
- Language stays plain: no "earn", "yield", "profit" or "passive income".
- The product is Isusu, built on BNB Chain. Never brand it as Binance or BNB.
