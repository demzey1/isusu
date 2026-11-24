"use client";

import { useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { bsc } from "wagmi/chains";
import type { Address } from "viem";

import { isusuAbi } from "@/lib/abi";
import { erc20Abi } from "@/lib/abi-extra";
import { collateralFor, payoutFor } from "@/lib/circle";
import { ISUSU_ADDRESS, USDT_ADDRESS } from "@/lib/config";
import { formatDate, formatUsdt, shortAddress } from "@/lib/format";
import { useUsdt } from "@/lib/hooks";
import { approvalSteps, useTx } from "@/lib/tx";
import { circleStatus, type CircleDetail } from "@/lib/types";

import { CountdownBlocks } from "./countdown";
import { ConfirmDialog } from "./confirm-dialog";
import { ArrowRight, Check, Clock, Info, Spinner } from "./icons";
import { UsdtLogo } from "./usdt-logo";
import { WalletButton } from "./wallet-button";

type Mode = "contribute" | "withdraw" | "cancel" | "close" | null;

export function RoundPanel({
  detail,
  now,
  address,
}: {
  detail: CircleDetail;
  now: number;
  address?: Address;
}) {
  const { view, seats } = detail;
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const usdt = useUsdt(address);
  const tx = useTx();
  const [mode, setMode] = useState<Mode>(null);

  const status = circleStatus(view, now);
  const me = useMemo(
    () => (address ? seats.find((seat) => seat.owner?.toLowerCase() === address.toLowerCase()) : undefined),
    [seats, address],
  );
  const member = me?.member;
  const paidCount = seats.filter((seat) => seat.member?.paid).length;
  const overdue = now > 0 && now > Number(view.deadline);
  const closeable = overdue && now > Number(view.deadline) + 86400;
  const wrongChain = Boolean(address) && chainId !== bsc.id;

  const panelClass =
    "rounded-card border border-ink/[0.1] bg-white/55 p-5 shadow-[0_18px_40px_-34px_rgba(20,17,15,0.5)] sm:p-6";

  const contributeSteps = () => [
    ...approvalSteps({
      allowance: usdt.data?.allowance,
      amount: view.contribution,
      approve: (amount) => ({
        address: USDT_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [ISUSU_ADDRESS, amount],
      }),
      label: (amount) => `Approve exactly ${formatUsdt(amount)} USDT`,
    }),
    {
      label: `Pay round ${view.round}`,
      request: {
        address: ISUSU_ADDRESS as `0x${string}`,
        abi: isusuAbi,
        functionName: "contribute" as const,
        args: [BigInt(detail.id)] as const,
      },
    },
  ];

  const withdrawSteps = () => [
    {
      label: "Withdraw your USDT",
      request: {
        address: ISUSU_ADDRESS as `0x${string}`,
        abi: isusuAbi,
        functionName: "withdraw" as const,
        args: [BigInt(detail.id)] as const,
      },
    },
  ];

  const cancelSteps = () => [
    {
      label: "Cancel the circle and unlock refunds",
      request: {
        address: ISUSU_ADDRESS as `0x${string}`,
        abi: isusuAbi,
        functionName: "cancelCircle" as const,
        args: [BigInt(detail.id)] as const,
      },
    },
  ];

  const closeSteps = () => [
    {
      label: "Settle the overdue round",
      request: {
        address: ISUSU_ADDRESS as `0x${string}`,
        abi: isusuAbi,
        functionName: "closeRound" as const,
        args: [BigInt(detail.id)] as const,
      },
    },
  ];

  async function confirm() {
    const steps =
      mode === "contribute"
        ? contributeSteps()
        : mode === "withdraw"
          ? withdrawSteps()
          : mode === "cancel"
            ? cancelSteps()
            : mode === "close"
              ? closeSteps()
              : [];
    const receipt = await tx.run(steps);
    if (receipt) {
      setMode(null);
      tx.reset();
    }
  }

  // ---------------------------------------------------------------- expired
  if (status === "expired") {
    return (
      <div className={panelClass}>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-clay">
          Deadline passed
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
          This circle didn&apos;t fill
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          {view.joined} of {view.slots} seats were taken by the deadline. Anyone can now cancel it. Each
          member then takes back their full round-1 payment and collateral — nothing is pushed to you,
          you pull it yourself.
        </p>

        {member && (
          <div className="mt-4 rounded-2xl bg-moss/[0.08] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-ink/45">Your refund once cancelled</p>
            <p className="tnum mt-1 font-mono text-2xl text-moss">{formatUsdt(member.deposited)} USDT</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            tx.reset();
            setMode("cancel");
          }}
          disabled={tx.busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-6 py-4 text-[0.95rem] font-semibold text-ink transition hover:brightness-[1.03] disabled:opacity-40"
        >
          Cancel circle and unlock refunds <ArrowRight />
        </button>

        <ConfirmDialog
          open={mode === "cancel"}
          onClose={() => !tx.busy && setMode(null)}
          onConfirm={confirm}
          title="Cancel this circle?"
          description="It missed its join deadline without filling."
          rows={[
            { label: "Seats taken", value: `${view.joined} of ${view.slots}` },
            { label: "Everyone gets back", value: "Round 1 + collateral", strong: true },
            { label: "Your refund", value: member ? `${formatUsdt(member.deposited)} USDT` : "Not a member" },
          ]}
          note="Cancelling doesn't send money automatically. Every member withdraws their own refund afterwards. Anyone can press this button, and it cannot be undone."
          confirmLabel="Cancel circle"
          pendingLabel={tx.phase === "confirming" ? "Waiting for the network…" : "Confirm in your wallet…"}
          pending={tx.busy}
          error={tx.error}
        />
      </div>
    );
  }

  // -------------------------------------------------------------- cancelled
  if (status === "cancelled") {
    const refund = member?.credit ?? 0n;
    return (
      <div className={panelClass}>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-clay">Cancelled</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
          Everyone gets a full refund
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          This circle never filled. Payouts never started and each member can pull back their full
          round-1 payment plus collateral.
        </p>

        {member ? (
          refund > 0n ? (
            <>
              <div className="mt-4 rounded-2xl bg-moss/[0.08] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-ink/45">Ready to withdraw</p>
                <p className="tnum mt-1 font-mono text-2xl text-moss">{formatUsdt(refund)} USDT</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  tx.reset();
                  setMode("withdraw");
                }}
                disabled={tx.busy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-6 py-4 text-[0.95rem] font-semibold text-ink disabled:opacity-40"
              >
                Withdraw {formatUsdt(refund)} USDT
              </button>
            </>
          ) : (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-moss/[0.08] p-3 text-sm text-moss">
              <Check className="h-4 w-4" /> You have taken your refund.
            </p>
          )
        ) : (
          <p className="mt-4 rounded-xl bg-ink/[0.035] p-3 text-sm text-ink/55">
            This wallet was not a member, so there is nothing to withdraw.
          </p>
        )}

        <ConfirmDialog
          open={mode === "withdraw"}
          onClose={() => !tx.busy && setMode(null)}
          onConfirm={confirm}
          title="Withdraw your refund"
          rows={[
            { label: "Round 1 payment", value: `${formatUsdt(view.contribution)} USDT` },
            {
              label: "Collateral",
              value: member ? `${formatUsdt(member.credit - view.contribution)} USDT` : "—",
            },
            { label: "You receive", value: `${formatUsdt(refund)} USDT`, strong: true },
          ]}
          note="This sends the USDT to your connected wallet. No approval is needed."
          confirmLabel="Withdraw"
          pendingLabel={tx.phase === "confirming" ? "Waiting for the network…" : "Confirm in your wallet…"}
          pending={tx.busy}
          error={tx.error}
        />
      </div>
    );
  }

  // --------------------------------------------------------------- finished
  if (status === "finished") {
    const credit = member?.credit ?? 0n;
    return (
      <div className={panelClass}>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-moss">Complete</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
          Every round has settled
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Payouts are automatic in this contract. The pot went to each paying seat in turn as the
          rounds settled — there is no claim button to press.
        </p>

        {member && (
          <>
            <dl className="mt-4 space-y-2.5 rounded-2xl bg-ink/[0.035] p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink/55">You paid in</dt>
                <dd className="tnum font-mono text-ink/80">{formatUsdt(member.deposited)} USDT</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink/55">You received</dt>
                <dd className="tnum font-mono text-ink/80">{formatUsdt(member.received)} USDT</dd>
              </div>
              {member.defaulted && (
                <div className="flex justify-between gap-3">
                  <dt className="text-clay">Seat defaulted</dt>
                  <dd className="text-clay">Collateral forfeited</dd>
                </div>
              )}
            </dl>

            {credit > 0n ? (
              <>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-ink/55">Ready to withdraw</span>
                  <span className="tnum font-mono text-xl text-moss">{formatUsdt(credit)} USDT</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    tx.reset();
                    setMode("withdraw");
                  }}
                  disabled={tx.busy}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-6 py-4 text-[0.95rem] font-semibold text-ink disabled:opacity-40"
                >
                  Withdraw {formatUsdt(credit)} USDT
                </button>
              </>
            ) : (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-moss/[0.08] p-3 text-sm text-moss">
                <Check className="h-4 w-4" /> Nothing left to withdraw on this circle.
              </p>
            )}
          </>
        )}

        <ConfirmDialog
          open={mode === "withdraw"}
          onClose={() => !tx.busy && setMode(null)}
          onConfirm={confirm}
          title="Withdraw what's left"
          rows={[
            { label: "Your remaining credit", value: `${formatUsdt(credit)} USDT`, strong: true },
            { label: "Sent to", value: address ? shortAddress(address) : "—" },
          ]}
          note="This is your returned collateral plus any share of the compensation pool. No approval is needed."
          confirmLabel="Withdraw"
          pendingLabel={tx.phase === "confirming" ? "Waiting for the network…" : "Confirm in your wallet…"}
          pending={tx.busy}
          error={tx.error}
        />
      </div>
    );
  }

  // ----------------------------------------------------------------- active
  const iHavePaid = Boolean(member?.paid);
  const defaulted = Boolean(member?.defaulted);
  const mySlot = member?.slot ?? 0;

  return (
    <div className={panelClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            Round {view.round} of {view.slots}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
            {view.round === mySlot ? "Your pot round" : "Keep the circle turning"}
          </h2>
        </div>
        <span className="rounded-full bg-moss/[0.1] px-3 py-1 text-xs font-semibold text-moss">
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
                ? "Anyone can settle this round now. Unpaid seats are defaulted or charged from collateral."
                : "It is in the 24-hour grace period. Anyone can settle it once the grace ends."}
            </p>
          ) : (
            <CountdownBlocks target={view.deadline} now={now} />
          )}
        </div>
        <p className="mt-2 text-[0.7rem] text-ink/40">
          Round ends {formatDate(view.deadline)} · seat {view.round} receives{" "}
          {formatUsdt(view.contribution * BigInt(view.active))} USDT
        </p>
      </div>

      {!address ? (
        <div className="mt-4 rounded-2xl border border-ink/10 bg-cream/60 p-4">
          <p className="text-sm leading-relaxed text-ink/65">
            Connect your wallet to see your seat and pay this round.
          </p>
          <div className="mt-3">
            <WalletButton />
          </div>
        </div>
      ) : !member ? (
        <div className="mt-4 rounded-2xl bg-ink/[0.035] p-4">
          <p className="text-sm leading-relaxed text-ink/65">
            This wallet doesn&apos;t hold a seat. The circle is full, so joining is closed.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-2xl bg-ink/[0.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.12em] text-ink/40">Your seat</p>
                <p className="tnum mt-0.5 font-mono text-xl text-ink">{mySlot}</p>
              </div>
              <div className="text-right">
                <p className="text-[0.68rem] uppercase tracking-[0.12em] text-ink/40">Your payout</p>
                <p className="tnum mt-0.5 font-mono text-xl text-ink">{formatUsdt(payoutFor(view))} USDT</p>
              </div>
            </div>
            <p className="mt-3 border-t border-ink/10 pt-3 text-xs leading-relaxed text-ink/55">
              {defaulted
                ? "This seat missed a round before its payout and was closed. Collateral went to the pool."
                : mySlot < view.round
                  ? "Your payout has arrived. Keep paying each round — your remaining collateral backs the rest."
                  : mySlot === view.round
                    ? iHavePaid
                      ? "You are paid this round. The pot is released as soon as everyone else pays."
                      : "You receive the pot as soon as everyone pays this round."
                    : `You receive the pot in round ${mySlot}.`}
            </p>
          </div>

          {defaulted ? (
            <p className="mt-3 rounded-xl border border-clay/25 bg-clay/[0.07] p-3 text-sm text-clay">
              Your seat defaulted. You can still withdraw any credit once the circle finishes.
            </p>
          ) : iHavePaid ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-moss/[0.08] p-3 text-sm text-moss">
              <Check className="h-4 w-4" /> You&apos;ve paid for round {view.round}.
            </p>
          ) : (
            <>
              {overdue && (
                <p className="mt-3 rounded-xl border border-clay/25 bg-clay/[0.07] p-3 text-xs leading-relaxed text-clay">
                  This round is overdue. Pay now if you can — settling may default an unpaid seat before
                  its payout.
                </p>
              )}
              {wrongChain && (
                <div className="mt-3 rounded-xl border border-clay/30 bg-clay/[0.07] p-3 text-sm text-clay">
                  Your wallet is on another network.
                  <button
                    type="button"
                    onClick={() => switchChain({ chainId: bsc.id })}
                    disabled={switching}
                    className="ml-1 font-semibold underline underline-offset-2"
                  >
                    {switching ? "Switching…" : "Switch to BNB Chain"}
                  </button>
                </div>
              )}
              <button
                type="button"
                disabled={tx.busy || wrongChain}
                onClick={() => {
                  tx.reset();
                  setMode("contribute");
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-6 py-4 text-[0.95rem] font-semibold text-ink transition hover:brightness-[1.03] disabled:opacity-40"
              >
                Pay round {view.round} · {formatUsdt(view.contribution)} USDT <ArrowRight />
              </button>
              {usdt.data && usdt.data.balance < view.contribution && (
                <p className="mt-2 text-center text-xs text-clay">
                  Wallet balance: <span className="tnum font-mono">{formatUsdt(usdt.data.balance)} USDT</span>{" "}
                  — you need {formatUsdt(view.contribution)} USDT for this round.
                </p>
              )}
            </>
          )}
        </>
      )}

      {closeable && (
        <button
          type="button"
          onClick={() => {
            tx.reset();
            setMode("close");
          }}
          className="mt-4 w-full rounded-full border border-clay/30 px-5 py-3 text-sm font-medium text-clay transition hover:bg-clay/[0.06]"
        >
          Settle the overdue round
        </button>
      )}

      {!view.finished && !member && (
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink/40">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          If a round is missed, anyone can settle it after the 24-hour grace period. Members before their
          payout lose the seat; members after their payout have collateral charged.
        </p>
      )}

      <ConfirmDialog
        open={mode === "contribute"}
        onClose={() => {
          if (!tx.busy) {
            setMode(null);
            tx.reset();
          }
        }}
        onConfirm={confirm}
        title={`Pay round ${view.round}`}
        description={`Circle #${detail.id} · seat ${mySlot}`}
        rows={[
          { label: "Round contribution", value: `${formatUsdt(view.contribution)} USDT`, strong: true },
          { label: "Your seat", value: `Seat ${mySlot}` },
          {
            label: "Your payout",
            value: `${formatUsdt(payoutFor(view))} USDT`,
            hint: mySlot < view.round ? "Already paid out" : `Round ${mySlot}`,
          },
        ]}
        note={`USDT is approved for exactly ${formatUsdt(view.contribution)} — not unlimited. The contract pulls only this round's contribution.`}
        confirmLabel="Approve and pay"
        pendingLabel={tx.phase === "confirming" ? "Waiting for the network…" : "Confirm in your wallet…"}
        pending={tx.busy}
        error={tx.error}
      />

      <ConfirmDialog
        open={mode === "close"}
        onClose={() => !tx.busy && setMode(null)}
        onConfirm={confirm}
        title="Settle this round?"
        description="The round is more than 24 hours past its deadline."
        rows={[
          { label: "Round", value: `${view.round} of ${view.slots}` },
          { label: "Paid so far", value: `${paidCount} of ${view.active}` },
          { label: "Unpaid seats", value: `${view.active - paidCount}` },
        ]}
        note="Unpaid members who have not received the pot lose their seat and collateral. Unpaid members who already received the pot have USDT charged from their collateral. This keeps the pot whole and the circle moving."
        confirmLabel="Settle round"
        pendingLabel={tx.phase === "confirming" ? "Waiting for the network…" : "Confirm in your wallet…"}
        pending={tx.busy}
        error={tx.error}
      />
    </div>
  );
}
