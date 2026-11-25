"use client";

import { useMemo } from "react";

import { buildJoinSteps } from "@/lib/calldata";
import { collateralFor, joinCost, payoutDelaySeconds, payoutFor } from "@/lib/circle";
import { formatDuration, formatUsdt } from "@/lib/format";
import { useAgenticWalletChecks } from "@/lib/hooks";
import type { CircleDetail } from "@/lib/types";

import { useAgenticWallet } from "./agentic-wallet";
import { AgentActions } from "./agent-actions";
import { Info } from "./icons";
import { UsdtLogo } from "./usdt-logo";

export function JoinPanel({
  detail,
  selected,
  onSelect,
}: {
  detail: CircleDetail;
  selected: number | null;
  onSelect: (slot: number | null) => void;
}) {
  const { view, seats } = detail;
  const { address } = useAgenticWallet();
  const { data: checks } = useAgenticWalletChecks(address);
  const slot = selected && selected > 0 ? selected : 0;
  const cost = slot ? joinCost(view, slot) : 0n;
  const collateral = slot ? collateralFor(view, slot) : 0n;
  const payout = payoutFor(view);
  const seatsLeft = view.slots - view.joined;

  const steps = useMemo(
    () =>
      slot
        ? buildJoinSteps({
            id: detail.id,
            slot,
            amount: cost,
            allowance: checks?.allowance ?? 0n,
          })
        : [],
    [checks?.allowance, cost, detail.id, slot],
  );

  return (
    <div className="rounded-card border border-ink/[0.1] bg-white/55 p-5 shadow-[0_18px_40px_-34px_rgba(20,17,15,0.5)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            Open seats
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
            Choose your seat
          </h2>
        </div>
        <span className="tnum rounded-full bg-marigold/20 px-3 py-1 font-mono text-sm text-ink">
          {seatsLeft} left
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink/55">
        Seat 1 is paid first. Later seats pay less collateral and wait longer.
      </p>

      <div className="mt-5 grid grid-cols-5 gap-1.5">
        {seats.map((seat) => {
          const taken = Boolean(seat.owner);
          const isSelected = slot === seat.slot;
          return (
            <button
              key={seat.slot}
              type="button"
              disabled={taken}
              onClick={() => onSelect(seat.slot)}
              aria-pressed={isSelected}
              className={`rounded-xl border px-1 py-2 text-center transition ${
                taken
                  ? "cursor-not-allowed border-ink/[0.07] bg-ink/[0.03] text-ink/25"
                  : isSelected
                    ? "border-marigold bg-marigold text-ink shadow-[0_6px_18px_-10px_rgba(20,17,15,0.6)]"
                    : "border-ink/15 bg-cream text-ink/70 hover:border-marigold hover:text-ink"
              }`}
            >
              <span className="block text-[0.6rem] uppercase tracking-[0.08em] opacity-60">
                {taken ? "taken" : "seat"}
              </span>
              <span className="tnum block font-mono text-base leading-tight">{seat.slot}</span>
            </button>
          );
        })}
      </div>

      {slot > 0 ? (
        <>
          <div className="mt-5 rounded-2xl border border-ink/10 bg-cream/70 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink/60">Due today</span>
              <span className="flex items-baseline gap-1 text-ink">
                <UsdtLogo size={14} />
                <span className="tnum font-mono text-2xl font-medium leading-none">
                  {formatUsdt(cost)}
                </span>
              </span>
            </div>
            <dl className="mt-3 space-y-2 border-t border-ink/10 pt-3 text-[0.82rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink/50">Round 1</dt>
                <dd className="tnum font-mono text-ink/80">{formatUsdt(view.contribution)} USDT</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/50">
                  Collateral ({view.slots - slot} {view.slots - slot === 1 ? "round" : "rounds"})
                </dt>
                <dd className="tnum font-mono text-ink/80">{formatUsdt(collateral)} USDT</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/50">You receive</dt>
                <dd className="tnum font-mono text-ink">{formatUsdt(payout)} USDT</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/50">When</dt>
                <dd className="text-right text-ink/80">
                  {slot === 1
                    ? "When the circle fills"
                    : `About ${formatDuration(payoutDelaySeconds(view, slot))} after it fills`}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-4">
            <AgentActions steps={steps} amountLabel={`${formatUsdt(cost)} USDT`} />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink/40">
            Seats are final once the circle fills. If it never fills, cancel and withdraw everything.
          </p>
        </>
      ) : (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-ink/[0.035] p-3 text-xs leading-relaxed text-ink/55">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Pick a seat to see the exact cost and copy the request.
        </p>
      )}
    </div>
  );
}
