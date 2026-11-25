"use client";

import { ISUSU_ADDRESS } from "@/lib/config";
import { formatDate, formatUsdt } from "@/lib/format";
import { circleStatus, type CircleDetail } from "@/lib/types";

import { AgentActions } from "./agent-actions";
import { CountdownBlocks } from "./countdown";
import { Check, Clock } from "./icons";

export function RoundPanel({ detail, now }: { detail: CircleDetail; now: number }) {
  const { view } = detail;
  const status = circleStatus(view, now);
  const paidCount = detail.seats.filter((seat) => seat.member?.paid).length;
  const overdue = now > 0 && now > Number(view.deadline);
  const closeable = overdue && now > Number(view.deadline) + 86400;

  const panelClass =
    "rounded-card border border-ink/[0.1] bg-white/55 p-5 shadow-[0_18px_40px_-34px_rgba(20,17,15,0.5)] sm:p-6";

  const withdrawPrompt = `Withdraw my full balance from Isusu circle #${detail.id}, including any refund, returned collateral or held payout. Contract ${ISUSU_ADDRESS} on BNB Chain. Step 1: call withdraw(${detail.id}). Preview the amount, show me the amount, and wait for my confirmation before executing.`;

  if (status === "expired") {
    const cancelPrompt = `Cancel Isusu circle #${detail.id} because it did not fill before its join deadline. Contract ${ISUSU_ADDRESS} on BNB Chain. Step 1: call cancelCircle(${detail.id}). Preview the call and wait for my confirmation before executing.`;

    return (
      <div className={panelClass}>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-clay">
          Deadline passed
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
          This circle did not fill
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          {view.joined} of {view.slots} seats were taken. Anyone can cancel it. Each member then
          withdraws their full payment and collateral.
        </p>

        <div className="mt-4">
          <AgentActions prompt={cancelPrompt} />
        </div>

        <div className="mt-4">
          <AgentActions
            prompt={withdrawPrompt}
            amountLabel={`${formatUsdt(view.contribution)} USDT round 1, plus collateral`}
          />
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className={panelClass}>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-clay">Cancelled</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
          Full refunds are open
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Payouts never started. Each member pulls back their round-1 payment, collateral and any
          held balance.
        </p>
        <div className="mt-4">
          <AgentActions prompt={withdrawPrompt} />
        </div>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div className={panelClass}>
        <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/45">
          <Check className="h-3.5 w-3.5" /> Complete
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
          Every round has settled
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Payouts went out automatically as each round closed. Withdraw any returned collateral or held
          payout.
        </p>
        <div className="mt-4">
          <AgentActions prompt={withdrawPrompt} />
        </div>
      </div>
    );
  }

  const contributePrompt = `Contribute ${formatUsdt(view.contribution)} USDT to Isusu circle #${detail.id}. Contract ${ISUSU_ADDRESS} on BNB Chain. Step 1: approve exactly ${formatUsdt(view.contribution)} USDT to the contract. Step 2: call contribute(${detail.id}). Preview each step, show me the amounts, and wait for my confirmation before executing.`;

  const settlePrompt = `Settle the overdue round of Isusu circle #${detail.id}. Contract ${ISUSU_ADDRESS} on BNB Chain. Step 1: call closeRound(${detail.id}). Preview the call, show me the amount, and wait for my confirmation before executing.`;

  return (
    <div className={panelClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            Round {view.round} of {view.slots}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
            Keep the circle turning
          </h2>
        </div>
        <span className="tnum rounded-full bg-ink/[0.06] px-3 py-1 font-mono text-xs text-ink/60">
          {paidCount}/{view.active} paid
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-ink/10 bg-cream/70 p-4">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-ink/40">
          <Clock className="h-3.5 w-3.5" />
          {overdue ? "Round deadline passed" : "This round closes in"}
        </p>
        <div className="mt-2">
          {overdue ? (
            <p className="text-sm leading-relaxed text-clay">
              {closeable
                ? "Anyone can settle this round now. Unpaid seats are defaulted or charged."
                : "It is in the 24 hour grace period."}
            </p>
          ) : (
            <CountdownBlocks target={view.deadline} now={now} />
          )}
        </div>
        <p className="mt-2 text-[0.7rem] text-ink/40">
          Ends {formatDate(view.deadline)}. Seat {view.round} receives{" "}
          {formatUsdt(view.contribution * BigInt(view.active))} USDT.
        </p>
      </div>

      <div className="mt-4">
        <AgentActions
          prompt={contributePrompt}
          amountLabel={`${formatUsdt(view.contribution)} USDT`}
        />
      </div>

      {overdue && closeable && (
        <div className="mt-4">
          <AgentActions prompt={settlePrompt} />
        </div>
      )}

      <div className="mt-4">
        <AgentActions prompt={withdrawPrompt} />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink/40">
        A wallet without a seat can still copy a request. The contract rejects actions that do not
        apply to it. Read the rules before acting.
      </p>
    </div>
  );
}
