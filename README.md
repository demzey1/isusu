# Isusu

On-chain rotating savings circles (Ajo/Esusu) on BNB Chain, settled in USDT.
Anyone holding an [Agent ID](https://web3.binance.com/en/dev-docs) can create a
circle or take a slot in one. There is no owner and no admin function.

## Mechanics

A circle has `N` members, each contributing the same `contribution` every round.
The member in slot `r` receives the pot in round `r`.

- **Create** — `createCircle(contribution, slots, roundDuration)`; caller must
  hold an Agent ID (`balanceOf > 0`). 2–20 slots, rounds of 1h–365d.
- **Join** — `join(id, slot)` picks an unused slot 1..N, final on join. Pays the
  round-1 contribution plus collateral of `contribution * (N - slot)`.
  The circle starts when the last slot is filled and round 1 pays slot 1.
- **Contribute** — `contribute(id)` pulls one contribution. The round settles as
  soon as every active member has paid; the pot goes to that round's slot owner.
- **Overdue rounds** — after the deadline plus a 24h grace period, anyone may call
  `closeRound(id)`. Unpaid members are charged from their own collateral, so the
  pot stays whole. A member whose collateral cannot cover the charge is marked
  defaulted: their payout slot is forfeited and the pot collected in that round
  compensates members who were paid short, with the remainder refunded pro rata.
- **Refunds** — after the final round each member calls `withdraw(id)` to take
  back their unspent collateral.

Collateral equals exactly the contributions a member still owes after receiving
their payout, so a member who takes the pot and disappears can always be fully
charged. Shortfalls can only originate before payout; those are covered by the
forfeited slot and proven in the tests.

## Build and test

```bash
forge build
forge test
```

`testFuzz_ConservationOfFunds` runs random join/pay/default patterns and asserts
that no USDT is created or destroyed and that the contract's balance always
equals its liabilities.

## Deploy

Copy `.env.example` to `.env`, fill in `BSC_RPC_URL` and `PRIVATE_KEY`, then:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url "$BSC_RPC_URL" --broadcast
```

The USDT address is verified on-chain (`symbol()` → `USDT`) and matches
PancakeSwap's token list. USDT on BSC has **18 decimals**.
