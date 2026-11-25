"use client";

import { useMemo, useState } from "react";

import { ISUSU_ADDRESS } from "@/lib/config";
import { formatDuration, formatUsdt } from "@/lib/format";

import { AgentActions } from "./agent-actions";
import { Check } from "./icons";
import { UsdtLogo } from "./usdt-logo";

const SEATS = 5;
const USDT = 10n ** 18n;

const CONTRIBUTIONS = [
  { amount: USDT, label: "1 USDT", hint: "5 USDT pot" },
  { amount: 2n * USDT, label: "2 USDT", hint: "10 USDT pot" },
] as const;

const ROUND_OPTIONS = [
  { days: 1, label: "Daily", hint: "Pay every day" },
  { days: 3, label: "Every 3 days", hint: "A steadier rhythm" },
  { days: 7, label: "Weekly", hint: "The usual circle" },
];

const JOIN_OPTIONS = [
  { days: 1, label: "1 day" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
];

export function CreateForm() {
  const [contribution, setContribution] = useState<bigint>(CONTRIBUTIONS[0].amount);
  const [roundDays, setRoundDays] = useState(7);
  const [joinDays, setJoinDays] = useState(7);

  const summary = useMemo(
    () => ({
      pot: contribution * BigInt(SEATS),
      firstSeat: contribution * BigInt(SEATS),
      lastSeat: contribution,
    }),
    [contribution],
  );

  const prompt = `Create an Isusu circle with 5 seats at ${formatUsdt(contribution)} USDT each round, a ${roundDays} day round and a ${joinDays} day join window. Contract ${ISUSU_ADDRESS} on BNB Chain. Step 1: call createCircle(${contribution}, ${roundDays * 86400}, ${joinDays * 86400}). No USDT is taken to open it. Preview the call, show me the arguments, and wait for my confirmation before executing.`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <div className="rounded-card border border-ink/[0.1] bg-white/55 p-5 shadow-[0_18px_40px_-34px_rgba(20,17,15,0.5)] sm:p-7">
        <p className="rounded-2xl border border-ink/10 bg-cream/70 px-4 py-3 text-sm leading-relaxed text-ink/60">
          Five seats, five rounds. Pick the contribution and rhythm.
        </p>

        <fieldset className="mt-6">
          <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            1 · Each person pays
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {CONTRIBUTIONS.map((option) => (
              <button
                key={option.amount.toString()}
                type="button"
                onClick={() => setContribution(option.amount)}
                aria-pressed={contribution === option.amount}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  contribution === option.amount
                    ? "border-marigold bg-marigold/15 shadow-[0_10px_24px_-20px_rgba(20,17,15,0.7)]"
                    : "border-ink/12 bg-cream hover:border-ink/25"
                }`}
              >
                <span className="tnum block font-mono text-2xl text-ink">{option.label}</span>
                <span className="mt-0.5 block text-sm text-ink/55">{option.hint}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink/40">USDT on BNB Chain. The pot is five times the contribution.</p>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            2 · How often
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {ROUND_OPTIONS.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setRoundDays(option.days)}
                aria-pressed={roundDays === option.days}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  roundDays === option.days
                    ? "border-marigold bg-marigold/15"
                    : "border-ink/12 bg-cream hover:border-ink/25"
                }`}
              >
                <span className="block text-sm font-semibold text-ink">{option.label}</span>
                <span className="mt-0.5 block text-[0.7rem] leading-snug text-ink/45">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            3 · Time to fill
          </legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {JOIN_OPTIONS.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setJoinDays(option.days)}
                aria-pressed={joinDays === option.days}
                className={`rounded-xl border px-2 py-2.5 text-sm transition ${
                  joinDays === option.days
                    ? "border-marigold bg-marigold text-ink"
                    : "border-ink/12 bg-cream text-ink/65 hover:border-ink/25"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink/40">
            If the circle is not full by then, anyone can cancel and every member withdraws everything.
          </p>
        </fieldset>

        <p className="mt-6 border-t border-ink/10 pt-4 text-xs leading-relaxed text-ink/45">
          Terms are fixed at creation. Opening a circle costs no USDT, only the network fee.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <aside className="rounded-card border border-ink/[0.1] bg-white/45 p-5 sm:p-6">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/40">
            What you open
          </p>

          <p className="mt-3 flex items-baseline gap-1.5">
            <UsdtLogo size={20} />
            <span className="tnum font-mono text-4xl font-medium leading-none tracking-[-0.03em]">
              {formatUsdt(summary.pot)}
            </span>
          </p>
          <p className="mt-1 text-sm text-ink/50">the pot, every round</p>

          <dl className="mt-6 space-y-3 border-t border-ink/10 pt-5 text-sm">
            {[
              ["People", `${SEATS}`],
              ["Each pays", `${formatUsdt(contribution)} USDT`],
              ["Every", formatDuration(roundDays * 86400)],
              ["Join window", formatDuration(joinDays * 86400)],
              ["Circle runs", formatDuration(SEATS * roundDays * 86400)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-ink/50">{label}</dt>
                <dd className="tnum font-mono text-ink/85">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 rounded-xl bg-marigold/10 p-3 text-xs leading-relaxed text-ink/60">
            Seat 1 pays {formatUsdt(summary.firstSeat)} USDT today and takes the first pot. Seat 5 pays{" "}
            {formatUsdt(summary.lastSeat)} USDT and waits {formatDuration((SEATS - 1) * roundDays * 86400)}.
          </p>

          <ul className="mt-4 space-y-2 text-xs leading-relaxed text-ink/55">
            {["No admin, owner or pause.", "Payouts are automatic.", "Missing a round can cost a seat."].map(
              (item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marigold" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </aside>

        <AgentActions prompt={prompt} amountLabel="No USDT. Network fee only." />
      </div>
    </div>
  );
}
