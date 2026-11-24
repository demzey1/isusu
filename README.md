# Isusu

On-chain rotating savings circles (Ajo/Esusu) on BNB Chain, settled in USDT.
Anyone holding an [Agent ID](https://web3.binance.com/en/dev-docs) can create a
circle or take a slot in one. There is no owner and no admin function.

## Mechanics

Every circle has exactly **five seats** and five rounds. Members contribute
either **1 USDT** or **2 USDT** per round, so every pot is exactly 5 or 10 USDT.
The member in slot `r` receives the pot in round `r`.

- **Create** — `createCircle(contribution, roundDuration, joinWindow)`; caller
  must hold an Agent ID (`balanceOf > 0`). `contribution` is 1 or 2 USDT, and
  both `roundDuration` and `joinWindow` are exactly 1, 3 or 7 days. The join
  deadline is set to `block.timestamp + joinWindow`.
- **Join** — `join(id, slot)` picks an unused slot 1..5, final on join. Pays the
  round-1 contribution plus collateral of `contribution * (5 - slot)`. Joins
  close at the deadline. The circle starts the moment the last slot fills and
  round 1 pays slot 1.
- **Not full by the deadline** — anyone may call `cancelCircle(id)`. Nothing is
  pushed: each member then calls `withdraw(id)` to pull back their full round-1
  contribution and full collateral.
- **Contribute** — `contribute(id)` pulls one contribution. The round settles as
  soon as every active member has paid; the pot goes to that round's slot owner.
- **Overdue rounds** — after the deadline plus a 24h grace period, anyone may call
  `closeRound(id)`. A member who has already received their pot is charged from
  collateral, so the pot stays whole. A member who has *not* received yet is
  defaulted instead: collateral is post-payout security only, otherwise a member
  could spend it early, collect the pot and leave. On default the slot is
  forfeited and the remaining collateral joins the pool.
- **Refunds** — after the final round, or after a cancelled circle, each member
  calls `withdraw(id)` to take back their remaining credit.
- **Failed payouts** — if the USDT transfer to a recipient fails, the pot is not
  lost and settlement does not revert. It is credited to that member's
  `owed` balance, which they can pull with `withdraw(id)` immediately.
- **Avatars** — any wallet can store a display avatar with `setAvatar(id)`
  (`0..15`); `avatarOf(address)` reads it. This is presentation only and has no
  effect on circle funds.

At the end of a completed circle the pool first tops up any non-defaulting member
whose pots plus collateral are worth less than what they paid in, then splits any
surplus pro rata by amount paid.

Collateral equals exactly the contributions a member still owes after receiving
their payout. That is why it cannot be used before payout: spending it would
leave the post-payout rounds unsecured, which is what let a member collect and
walk away in the original design.

## Build and test

```bash
forge build
forge test
```

`testFuzz_ConservationOfFunds` runs random join/pay/default patterns and asserts
that no USDT is created or destroyed and that the contract's balance always
equals its liabilities. The non-defaulter suite additionally fuzzes default
clusters and asserts that every member who never defaults finishes with at least
what they paid in. Failed-payout transfers are covered by freezing a recipient in
the mock token and checking the deferred balance is withdrawable.

## Deploy

Copy `.env.example` to `.env`, fill in `BSC_RPC_URL` and `PRIVATE_KEY`, then:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url "$BSC_RPC_URL" --broadcast
```

The USDT address is verified on-chain (`symbol()` → `USDT`) and matches
PancakeSwap's token list. USDT on BSC has **18 decimals**.
