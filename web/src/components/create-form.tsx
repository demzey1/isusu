"use client";

import { useMemo, useState } from "react";

import { buildCreateSteps } from "@/lib/calldata";
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

function OptionButton({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-12 shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-xl border px-4 text-left transition-colors ${
        selected
          ? "border-marigold bg-marigold text-ink"
          : "border-line bg-cream text-ink hover:border-ink/30"
      }`}
    >
      <span className="font-mono text-[15px] font-medium">{label}</span>
      {hint ? (
        <span className={`text-[13px] ${selected ? "text-ink/70" : "text-secondary"}`}>{hint}</span>
      ) : null}
    </button>
  );
}

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

  const steps = useMemo(
    () =>
      buildCreateSteps({
        contribution,
        roundSeconds: roundDays * 86400,
        joinSeconds: joinDays * 86400,
      }),
    [contribution, joinDays, roundDays],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
      <section className="card min-w-0 p-5 sm:p-7">
        <p className="text-sm leading-relaxed text-secondary">
          Five seats, five rounds. Pick the contribution and rhythm.
        </p>

        <fieldset className="mt-8 min-w-0">
          <legend className="label">1 · Each person pays</legend>
          <div className="scroll-box mt-3 flex gap-2 pb-2">
            {CONTRIBUTIONS.map((option) => (
              <OptionButton
                key={option.amount.toString()}
                label={option.label}
                hint={option.hint}
                selected={contribution === option.amount}
                onClick={() => setContribution(option.amount)}
              />
            ))}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-secondary">
            USDT on BNB Chain. The pot is five times the contribution.
          </p>
        </fieldset>

        <fieldset className="mt-8 min-w-0">
          <legend className="label">2 · How often</legend>
          <div className="scroll-box mt-3 flex gap-2 pb-2">
            {ROUND_OPTIONS.map((option) => (
              <OptionButton
                key={option.days}
                label={option.label}
                hint={option.hint}
                selected={roundDays === option.days}
                onClick={() => setRoundDays(option.days)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8 min-w-0">
          <legend className="label">3 · Time to fill</legend>
          <div className="scroll-box mt-3 flex gap-2 pb-2">
            {JOIN_OPTIONS.map((option) => (
              <OptionButton
                key={option.days}
                label={option.label}
                selected={joinDays === option.days}
                onClick={() => setJoinDays(option.days)}
              />
            ))}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-secondary">
            If the circle is not full by then, anyone can cancel and every member withdraws
            everything.
          </p>
        </fieldset>

        <p className="mt-8 border-t border-line pt-5 text-[13px] leading-relaxed text-secondary">
          Terms are fixed at creation. Opening a circle costs no USDT, only the network fee.
        </p>
      </section>

      <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24">
        <aside className="card min-w-0 p-5 sm:p-6">
          <p className="label">What you open</p>

          <p className="mt-4 flex items-baseline gap-2">
            <UsdtLogo size={20} className="shrink-0" />
            <span className="tnum font-mono text-4xl leading-none text-ink">
              {formatUsdt(summary.pot)}
            </span>
          </p>
          <p className="mt-2 text-sm text-secondary">the pot, every round</p>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            {[
              ["People", `${SEATS}`],
              ["Each pays", `${formatUsdt(contribution)} USDT`],
              ["Every", formatDuration(roundDays * 86400)],
              ["Join window", formatDuration(joinDays * 86400)],
              ["Circle runs", formatDuration(SEATS * roundDays * 86400)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-secondary">{label}</dt>
                <dd className="tnum font-mono text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 rounded-xl bg-marigold/10 p-3 text-[13px] leading-relaxed text-body">
            Seat 1 pays {formatUsdt(summary.firstSeat)} USDT today and takes the first pot. Seat 5
            pays {formatUsdt(summary.lastSeat)} USDT and waits{" "}
            {formatDuration((SEATS - 1) * roundDays * 86400)}.
          </p>

          <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-secondary">
            {["No admin, owner or pause.", "Payouts are automatic.", "Missing a round can cost a seat."].map(
              (item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-marigold" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </aside>

        <AgentActions steps={steps} amountLabel="No USDT. Network fee only." />
      </div>
    </div>
  );
}
