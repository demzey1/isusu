"use client";

import { useMemo } from "react";

import {
  buildCancelSteps,
  buildCloseRoundSteps,
  buildContributeSteps,
  buildWithdrawSteps,
} from "@/lib/calldata";
import { formatDate, formatUsdt } from "@/lib/format";
import { useAgenticWalletChecks } from "@/lib/hooks";
import { circleStatus, type CircleDetail } from "@/lib/types";

import { useAgenticWallet } from "./agentic-wallet";
import { AgentActions } from "./agent-actions";
import { CountdownBlocks } from "./countdown";
import { Check, Clock } from "./icons";

export function RoundPanel({ detail, now }: { detail: CircleDetail; now: number }) {
  const { view } = detail;
  const { address } = useAgenticWallet();
  const { data: checks } = useAgenticWalletChecks(address);
  const status = circleStatus(view, now);
  const paidCount = detail.seats.filter((seat) => seat.member?.paid).length;
  const overdue = now > 0 && now > Number(view.deadline);
  const closeable = overdue && now > Number(view.deadline) + 86400;

  const panelClass =
    "rounded-card border border-ink/[0.1] bg-white/55 p-5 shadow-[0_18px_40px_-34px_rgba(20,17,15,0.5)] sm:p-6";

  const withdrawSteps = useMemo(() => buildWithdrawSteps(detail.id), [detail.id]);
  const cancelSteps = useMemo(() => buildCancelSteps(detail.id), [detail.id]);
  const settleSteps = useMemo(() => buildCloseRoundSteps(detail.id), [detail.id]);
  const contributeSteps = useMemo(
    () =>
      buildContributeSteps({
        id: detail.id,
        amount: view.contribution,
        allowance: checks?.allowance ?? 0n,
      }),
    [checks?.allowance, detail.id, view.contribution],
  );

  if (status === "expired") {
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
          <AgentActions steps={cancelSteps} />
        </div>

        <div className="mt-4">
          <AgentActions
            steps={withdrawSteps}
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
          <AgentActions steps={withdrawSteps} />
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
          <AgentActions steps={withdrawSteps} />
        </div>
      </div>
    );
  }

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
          steps={contributeSteps}
          amountLabel={`${formatUsdt(view.contribution)} USDT`}
        />
      </div>

      {overdue && closeable && (
        <div className="mt-4">
          <AgentActions steps={settleSteps} />
        </div>
      )}

      <div className="mt-4">
        <AgentActions steps={withdrawSteps} />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink/40">
        A wallet without a seat can still copy a request. The contract rejects actions that do not
        apply to it. Read the rules before acting.
      </p>
    </div>
  );
}
