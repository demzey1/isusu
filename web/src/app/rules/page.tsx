import type { Metadata } from "next";
import Link from "next/link";

import { ArrowUpRight } from "@/components/icons";
import { ISUSU_ADDRESS, isConfigured } from "@/lib/config";

export const metadata: Metadata = {
  title: "The rules | Isusu",
  description:
    "How an Isusu circle works: seats, collateral, payouts, defaults and refunds.",
};

const CONTRIBUTIONS = [1, 2] as const;
const SEATS = 5;

function tiers(contribution: number) {
  return Array.from({ length: SEATS }, (_, index) => {
    const seat = index + 1;
    const collateral = contribution * (SEATS - seat);
    return {
      seat,
      collateral,
      due: contribution + collateral,
      round: seat,
    };
  });
}

export default function RulesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-14">
        <article>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/45">
            The rules
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-[clamp(2.3rem,5.5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
            The rules are code. Here they are in words.
          </h1>
          <p className="mt-4 max-w-2xl text-[1rem] leading-relaxed text-ink/60">
            A fixed group pays the same amount every round. Each member takes the whole pot once, in
            seat order. The contract holds the money and only does what is written here.
          </p>

          <Section n="01" title="Five seats, five rounds">
            <p>
              Every circle has <strong>five seats</strong>. Each member pays <strong>1 or 2 USDT</strong>{" "}
              per round, so every pot is exactly <strong>5 or 10 USDT</strong>. A round lasts 1, 3 or 7
              days, and the circle must fill within 1, 3 or 7 days of opening.
            </p>
            <p>
              Seat 1 is paid in round 1, seat 2 in round 2, and so on. The circle starts when the
              last seat is taken. Those terms are fixed at creation.
            </p>
          </Section>

          <Section n="02" title="Joining costs round 1 plus collateral">
            <p>
              You pay the round-1 contribution plus{" "}
              <strong>collateral = contribution × (5 − your seat)</strong>. Collateral covers the
              payments you still owe after your payout. Seat 5 pays none.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {CONTRIBUTIONS.map((contribution) => (
                <div key={contribution}>
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-ink/40">
                    {contribution} USDT each · {contribution * SEATS} USDT pot
                  </p>
                  <div className="overflow-hidden rounded-xl border border-ink/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-ink/[0.04] text-[0.58rem] uppercase tracking-[0.08em] text-ink/40">
                        <tr>
                          <th className="px-2.5 py-2 font-semibold">Seat</th>
                          <th className="px-2.5 py-2 font-semibold">Collateral</th>
                          <th className="px-2.5 py-2 font-semibold">Due today</th>
                          <th className="px-2.5 py-2 font-semibold">Pot in round</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/[0.07]">
                        {tiers(contribution).map((row) => (
                          <tr key={row.seat}>
                            <td className="tnum px-2.5 py-2 font-mono text-ink/70">{row.seat}</td>
                            <td className="tnum px-2.5 py-2 font-mono text-ink/70">{row.collateral}</td>
                            <td className="tnum px-2.5 py-2 font-mono text-ink">{row.due}</td>
                            <td className="tnum px-2.5 py-2 font-mono text-ink/50">{row.round}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/40">
              Amounts in USDT. Approvals are always for the exact amount of the action.
            </p>
          </Section>

          <Section n="03" title="Everyone pays every round">
            <p>
              Round 1 is paid when you join. After that, every active member pays each round. When
              all active members have paid, the contract sends the whole pot to that round&apos;s seat
              in the same transaction. There is no claim step.
            </p>
            <p>
              After your payout you keep paying the remaining rounds. Your collateral covers you if
              you stop.
            </p>
          </Section>

          <Section n="04" title="Miss a round before your payout, lose the seat">
            <p>
              If you miss a round while still waiting for the pot, the round can be settled after a{" "}
              <strong>24-hour grace</strong>. You lose that seat and your remaining collateral goes to
              the compensation pool.
            </p>
            <p>
              If you miss a round after your payout, the contribution is charged from your collateral.
              If it runs out, the seat defaults.
            </p>
            <p className="rounded-xl border border-clay/25 bg-clay/[0.06] p-3 text-clay">
              A missed round is not free. Before your payout it costs the seat and all remaining
              collateral.
            </p>
          </Section>

          <Section n="05" title="A default does not stop the circle">
            <p>
              The circle still pays every remaining seat. At the end, the pool first tops up any
              member who received less than they paid in, then shares any surplus by how much each
              member paid. Top-ups can arrive at the end, not instantly.
            </p>
          </Section>

          <Section n="06" title="Not full by the deadline means a full refund">
            <p>
              No one can join after the join window. If the circle is not full by then,{" "}
              <strong>anyone can cancel it</strong>. Each member then withdraws their round-1 payment
              plus all collateral. A cancelled circle never pays a pot.
            </p>
          </Section>

          <Section n="07" title="No admin can touch the money">
            <p>
              The contract has no owner, no pause and no upgrade switch. Money leaves only as a pot
              payout or a member&apos;s own withdrawal. Seats cannot be swapped or sold once the
              circle starts.
            </p>
            <p>
              Creating or joining needs an Agent ID in the wallet you use. Nothing else about you is
              checked.
            </p>
          </Section>
        </article>

        <aside className="rounded-card border border-ink/[0.1] bg-ink p-5 text-cream sm:p-6 lg:sticky lg:top-24">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cream/40">
            Fixed terms
          </p>
          <dl className="mt-4 space-y-2.5 text-sm">
            {[
              ["Seats", "5"],
              ["Each round", "1 or 2 USDT"],
              ["Pot", "5 or 10 USDT"],
              ["Round length", "1, 3 or 7 days"],
              ["Join window", "1, 3 or 7 days"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-cream/45">{label}</dt>
                <dd className="tnum font-mono text-cream/85">{value}</dd>
              </div>
            ))}
          </dl>

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
      <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-ink/65 sm:pl-8">{children}</div>
    </section>
  );
}
