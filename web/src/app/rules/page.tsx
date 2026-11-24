import type { Metadata } from "next";
import Link from "next/link";

import { ArrowUpRight, Check } from "@/components/icons";
import { RiskNote } from "@/components/risk-note";
import { ISUSU_ADDRESS, isConfigured } from "@/lib/config";

export const metadata: Metadata = {
  title: "The rules — Isusu",
  description:
    "How an Isusu circle works, in plain language: seats, collateral, payouts, defaults and refunds.",
};

const SEAT_EXAMPLE = [
  { seat: 1, collateral: 400, total: 500, wait: "First pot" },
  { seat: 2, collateral: 300, total: 400, wait: "1 round" },
  { seat: 3, collateral: 200, total: 300, wait: "2 rounds" },
  { seat: 4, collateral: 100, total: 200, wait: "3 rounds" },
  { seat: 5, collateral: 0, total: 100, wait: "4 rounds" },
];

export default function RulesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-14">
        <article>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-indigo/70">
            The rules
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-[clamp(2.3rem,5.5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
            The rules are code. Here they are in words.
          </h1>
          <p className="mt-4 max-w-2xl text-[1rem] leading-relaxed text-ink/60">
            Isusu is a rotating savings circle. A fixed group pays the same amount every round, and each
            member takes the whole pot once, in the order set by the seat they chose. Nobody holds the
            money in between: the contract does, and it only does what is written here.
          </p>

          <Section n="01" title="A circle has seats and rounds">
            <p>
              A circle has <strong>5 or 10 seats</strong> in this app (the contract allows 2 to 20). Every
              member pays the same <strong>contribution</strong> every round. The pot is the contribution
              multiplied by the number of seats.
            </p>
            <p>
              Seat 1 is paid in round 1, seat 2 in round 2, and so on. The circle starts the moment the
              last seat is taken, and round 1 pays out immediately.
            </p>
          </Section>

          <Section n="02" title="Joining costs round 1 plus collateral">
            <p>
              Your seat decides how much you put in today. You pay the round-1 contribution plus{" "}
              <strong>collateral = contribution × (seats − your seat)</strong>. That collateral is exactly
              the payments you still owe after your payout, so it only secures the rounds that come after
              you have been paid. If you take the last seat, the collateral is zero.
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink/[0.04] text-[0.62rem] uppercase tracking-[0.1em] text-ink/40">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold sm:px-4">Seat</th>
                    <th className="px-3 py-2.5 font-semibold sm:px-4">Collateral</th>
                    <th className="px-3 py-2.5 font-semibold sm:px-4">Due today</th>
                    <th className="px-3 py-2.5 font-semibold sm:px-4">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.07]">
                  {SEAT_EXAMPLE.map((row) => (
                    <tr key={row.seat}>
                      <td className="px-3 py-2.5 font-mono text-xs text-ink/70 sm:px-4">{row.seat}</td>
                      <td className="tnum px-3 py-2.5 font-mono text-xs text-ink/70 sm:px-4">
                        {row.collateral} USDT
                      </td>
                      <td className="tnum px-3 py-2.5 font-mono text-xs text-ink sm:px-4">
                        {row.total} USDT
                      </td>
                      <td className="px-3 py-2.5 text-xs text-ink/50 sm:px-4">
                        500 USDT · {row.wait}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-ink/40">
              Example: a 5-seat circle with a 100 USDT contribution. Your actual amounts are always shown
              before you sign anything.
            </p>
          </Section>

          <Section n="03" title="Everyone pays every round">
            <p>
              Round 1 is paid when you join, so the first pot is never short. After that, every active
              member pays the contribution each round. When every active member has paid, the contract
              sends the whole pot to that round&apos;s seat in the same transaction. There is no claim
              button: <strong>payouts are automatic</strong>.
            </p>
            <p>
              Once you have received your pot you keep paying the remaining rounds. Your collateral is
              there to cover you if you stop.
            </p>
          </Section>

          <Section n="04" title="Miss a round before your payout and you lose the seat">
            <p>
              Collateral is not a payment method before your payout. If you miss a round while you are
              still waiting for the pot, the round can be settled after a <strong>24-hour grace</strong>:
              you lose that seat and your remaining collateral goes to the compensation pool. This stops
              someone from spending their security, collecting the pot and walking away.
            </p>
            <p>
              If you miss a round <em>after</em> your payout, the contribution is charged from your
              collateral instead. If the collateral runs out, the seat defaults and you lose it.
            </p>
            <p className="rounded-xl border border-clay/25 bg-clay/[0.06] p-3 text-clay">
              A missed round is not free. Before your payout it costs you the seat and all remaining
              collateral.
            </p>
          </Section>

          <Section n="05" title="A default doesn't stop the circle">
            <p>
              If someone defaults, the circle still pays every remaining seat. The pot is kept whole from
              the withheld collateral and the pool. At the end, the pool first tops up any member who
              received less than they paid in, then shares any surplus by how much each member paid.
            </p>
            <p>
              <strong>Top-ups can arrive at the end of the circle, not instantly.</strong> That is the
              trade-off: the circle keeps moving, but making someone whole may take until the final round.
            </p>
          </Section>

          <Section n="06" title="Not full by the deadline means a full refund">
            <p>
              Every circle sets a join deadline when it is created — between 1 and 14 days. No one can
              join after it. If the circle isn&apos;t full by then, <strong>anyone can cancel it</strong>.
            </p>
            <p>
              Cancelling doesn&apos;t push money around. Each member then calls withdraw and pulls back
              their full round-1 payment plus full collateral, exactly what they put in. A cancelled
              circle never pays a pot.
            </p>
          </Section>

          <Section n="07" title="Seats are final once the circle fills">
            <p>
              You choose your seat when you join. Seats are unique and cannot be swapped, sold or left
              after the circle starts. There are no exits and no early refunds. Pick people you trust and
              an amount you can leave for the whole circle.
            </p>
          </Section>

          <Section n="08" title="No admin can touch the money">
            <p>
              The contract has no owner, no pause, no upgrade switch and no withdrawal function for
              anyone. It has no way to move funds except through the rules above. The only way money
              leaves is a pot payout or a member&apos;s own withdrawal.
            </p>
            <p>
              Creating or joining requires an Agent ID in the connected wallet. Nothing else about you is
              checked.
            </p>
          </Section>

          <Section n="09" title="What Isusu will never ask for">
            <ul className="space-y-2">
              {[
                "Your seed phrase.",
                "Your private key.",
                "A wallet pairing code.",
                "An unlimited USDT approval. Approvals are always for the exact amount of that action.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <div className="mt-8">
            <RiskNote />
          </div>
        </article>

        <aside className="rounded-card border border-ink/[0.1] bg-ink p-5 text-cream sm:p-6 lg:sticky lg:top-24">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cream/40">
            The short version
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-cream/70">
            {[
              "Everyone pays the same, every round.",
              "Each seat takes the pot once, in order.",
              "Seat 1 pays the most, waits the least.",
              "Miss before your payout: seat and collateral gone.",
              "Payouts are automatic.",
              "Not full by the deadline: full refunds.",
              "No admin can touch the money.",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-cream/10 pt-5">
            <p className="text-xs text-cream/40">Read it yourself</p>
            {isConfigured ? (
              <a
                href={`https://bscscan.com/address/${ISUSU_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 break-anywhere font-mono text-[0.65rem] text-marigold hover:underline"
              >
                {ISUSU_ADDRESS} <ArrowUpRight className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <p className="mt-1 text-xs text-cream/40">No contract configured in this build.</p>
            )}
            <p className="mt-2 text-[0.68rem] leading-relaxed text-cream/35">
              Built on BNB Chain. Settled in USDT. This is not a deposit, a security or an investment
              product.
            </p>
          </div>

          <Link
            href="/pools"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-[1.03]"
          >
            Browse circles <ArrowUpRight />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9 border-t border-ink/[0.09] pt-7">
      <div className="flex items-baseline gap-3">
        <span className="tnum font-mono text-xs text-ink/30">{n}</span>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] sm:text-[1.65rem]">{title}</h2>
      </div>
      <div className="mt-3 space-y-3 pl-0 text-[0.95rem] leading-relaxed text-ink/65 sm:pl-8">{children}</div>
    </section>
  );
}
