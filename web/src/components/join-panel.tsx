"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { bsc } from "wagmi/chains";

import { collateralFor, joinCost, payoutDelaySeconds, payoutFor } from "@/lib/circle";
import { ISUSU_ADDRESS, USDT_ADDRESS } from "@/lib/config";
import { formatDuration, formatUsdt } from "@/lib/format";
import { useAgentId, useUsdt } from "@/lib/hooks";
import { approvalSteps, useTx } from "@/lib/tx";
import type { CircleDetail } from "@/lib/types";
import { isusuAbi } from "@/lib/abi";
import { erc20Abi } from "@/lib/abi-extra";

import { AgentIdNeeded } from "./agent-gate";
import { ConfirmDialog } from "./confirm-dialog";
import { ArrowRight, Info } from "./icons";
import { UsdtLogo } from "./usdt-logo";
import { WalletButton } from "./wallet-button";

export function JoinPanel({
  detail,
  now,
  selected,
  onSelect,
}: {
  detail: CircleDetail;
  now: number;
  selected: number | null;
  onSelect: (slot: number | null) => void;
}) {
  const { view, seats } = detail;
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const agent = useAgentId(address);
  const usdt = useUsdt(address);
  const tx = useTx();
  const [confirming, setConfirming] = useState(false);
  const [ack, setAck] = useState(false);
  const [justJoined, setJustJoined] = useState<number | null>(null);

  const me = useMemo(
    () => (address ? seats.find((seat) => seat.owner?.toLowerCase() === address.toLowerCase()) : undefined),
    [seats, address],
  );

  const slot = selected && selected > 0 ? selected : 0;
  const cost = slot ? joinCost(view, slot) : 0n;
  const collateral = slot ? collateralFor(view, slot) : 0n;
  const payout = payoutFor(view);
  const seatsLeft = view.slots - view.joined;
  const balance = usdt.data?.balance;
  const enough = balance === undefined ? true : balance >= cost;
  const wrongChain = Boolean(address) && chainId !== bsc.id;
  const busy = tx.busy;

  useEffect(() => {
    if (!justJoined) return;
    const timer = setTimeout(() => setJustJoined(null), 12000);
    return () => clearTimeout(timer);
  }, [justJoined]);

  const joinSteps = () => {
    if (!slot || !address) return [];
    const approve = approvalSteps({
      allowance: usdt.data?.allowance,
      amount: cost,
      approve: (amount) => ({
        address: USDT_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [ISUSU_ADDRESS, amount],
      }),
      label: (amount) => `Approve exactly ${formatUsdt(amount)} USDT`,
    });

    return [
      ...approve,
      {
        label: `Take seat ${slot} of circle #${detail.id}`,
        request: {
          address: ISUSU_ADDRESS as `0x${string}`,
          abi: isusuAbi,
          functionName: "join" as const,
          args: [BigInt(detail.id), slot] as const,
        },
      },
    ];
  };

  async function handleJoin() {
    const receipt = await tx.run(joinSteps());
    if (receipt) {
      setConfirming(false);
      setAck(false);
      setJustJoined(slot);
    }
  }

  const panelClass =
    "rounded-card border border-ink/[0.1] bg-white/55 p-5 shadow-[0_18px_40px_-34px_rgba(20,17,15,0.5)] sm:p-6";

  if (justJoined || (me && !view.finished)) {
    const joinedSlot = me?.slot ?? justJoined ?? 0;
    return (
      <div className={panelClass}>
        {justJoined && (
          <p className="mb-3 rounded-xl bg-moss/10 px-3 py-2 text-sm font-medium text-moss">
            You are in. Seat {justJoined} is yours.
          </p>
        )}
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">Your seat</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-[-0.03em]">Seat {joinedSlot}</p>
        <p className="mt-1 text-sm text-ink/55">
          {seatsLeft > 0
            ? `Waiting for ${seatsLeft} more ${seatsLeft === 1 ? "person" : "people"} before the circle starts.`
            : "The circle is full. Round 1 pays seat 1."}
        </p>

        <dl className="mt-5 space-y-2.5 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink/55">You put in</dt>
            <dd className="tnum font-mono text-ink">{formatUsdt(joinCost(view, joinedSlot))} USDT</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink/55">You receive in round {joinedSlot}</dt>
            <dd className="tnum font-mono text-ink">{formatUsdt(payout)} USDT</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink/55">Collateral held back</dt>
            <dd className="tnum font-mono text-ink">{formatUsdt(collateralFor(view, joinedSlot))} USDT</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-ink/45">
          Your seat is final. If the circle doesn&apos;t fill by its deadline, everyone can cancel and
          take back their full payment.
        </p>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            Open seats
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
            Choose your turn
          </h2>
        </div>
        <span className="tnum rounded-full bg-indigo/[0.08] px-3 py-1 font-mono text-sm text-indigo">
          {seatsLeft} left
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink/55">
        Seat 1 gets the pot first. Later seats pay less collateral today but wait longer.
      </p>

      {!address ? (
        <div className="mt-5 rounded-2xl border border-ink/10 bg-cream/60 p-4">
          <p className="text-sm leading-relaxed text-ink/70">
            Connect a wallet to pick a seat. You stay in control: nothing is sent until you confirm.
          </p>
          <div className="mt-3">
            <WalletButton />
          </div>
        </div>
      ) : agent.isLoading ? (
        <p className="mt-5 text-sm text-ink/45">Checking your Agent ID…</p>
      ) : agent.isError ? (
        <p className="mt-5 rounded-xl border border-clay/30 bg-clay/[0.07] p-3 text-sm text-clay">
          Couldn&apos;t read your Agent ID from the chain. Check the RPC and reload.
        </p>
      ) : !agent.data || agent.data === 0n ? (
        <div className="mt-5">
          <AgentIdNeeded />
        </div>
      ) : (
        <>
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
                        : "border-ink/15 bg-cream text-ink/70 hover:border-indigo/40 hover:text-ink"
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
                  <span className="text-sm text-ink/60">Total due now</span>
                  <span className="flex items-baseline gap-1 text-ink">
                    <UsdtLogo size={14} />
                    <span className="tnum font-mono text-2xl font-medium leading-none">
                      {formatUsdt(cost)}
                    </span>
                  </span>
                </div>
                <dl className="mt-3 space-y-2 border-t border-ink/10 pt-3 text-[0.82rem]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/50">Round 1 contribution</dt>
                    <dd className="tnum font-mono text-ink/80">{formatUsdt(view.contribution)} USDT</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/50">
                      Collateral ({view.slots} − {slot} = {view.slots - slot}{" "}
                      {view.slots - slot === 1 ? "round" : "rounds"})
                    </dt>
                    <dd className="tnum font-mono text-ink/80">{formatUsdt(collateral)} USDT</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/50">Returned at the end</dt>
                    <dd className="tnum font-mono text-moss">{formatUsdt(collateral)} USDT</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/50">You receive</dt>
                    <dd className="tnum font-mono text-ink">
                      {formatUsdt(payout)} USDT
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/50">When</dt>
                    <dd className="text-right text-ink/80">
                      {slot === 1
                        ? "The moment the circle fills"
                        : `About ${formatDuration(payoutDelaySeconds(view, slot))} after it fills`}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 border-t border-ink/10 pt-3 text-[0.7rem] leading-relaxed text-ink/45">
                  If someone defaults, that round&apos;s pot is smaller. Any shortfall is topped up from
                  the compensation pool when the circle ends.
                </p>
              </div>

              {balance !== undefined && (
                <p className={`mt-2 text-right text-xs ${enough ? "text-ink/40" : "text-clay"}`}>
                  Wallet balance: <span className="tnum font-mono">{formatUsdt(balance)} USDT</span>
                  {!enough && " — not enough for this seat"}
                </p>
              )}

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-ink/[0.035] p-3 text-xs leading-relaxed text-ink/65">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(event) => setAck(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-marigold)]"
                />
                <span>
                  I understand that if I miss a round before my payout, I lose this seat and its
                  collateral, and that seats are final once the circle starts.
                </span>
              </label>

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
                disabled={!ack || !enough || wrongChain || busy}
                onClick={() => {
                  tx.reset();
                  setConfirming(true);
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-6 py-4 text-[0.95rem] font-semibold text-ink transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Take seat {slot} <ArrowRight />
              </button>
              <p className="mt-2 text-center text-[0.68rem] text-ink/35">
                Your wallet confirms each step: an exact {formatUsdt(cost)} USDT approval, then the
                join. Never unlimited.
              </p>
            </>
          ) : (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-ink/[0.035] p-3 text-xs leading-relaxed text-ink/55">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Tap a seat on the ring or in the grid to see exactly what it costs.
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => {
          if (busy) return;
          setConfirming(false);
          tx.reset();
        }}
        onConfirm={handleJoin}
        title={`Take seat ${slot}`}
        description={`Circle #${detail.id} · ${view.slots} seats · ${formatUsdt(view.contribution)} USDT each round`}
        rows={[
          { label: "Round 1 contribution", value: `${formatUsdt(view.contribution)} USDT` },
          {
            label: "Collateral",
            hint: `${view.slots - slot} ${view.slots - slot === 1 ? "round" : "rounds"} after your payout`,
            value: `${formatUsdt(collateral)} USDT`,
          },
          { label: "Total due now", value: `${formatUsdt(cost)} USDT`, strong: true },
          { label: "You receive", value: `${formatUsdt(payout)} USDT`, hint: `In round ${slot}` },
        ]}
        note={
          <span>
            USDT is approved for exactly {formatUsdt(cost)} — not unlimited. The network fee is paid
            separately in BNB. If you miss a round before your payout, you lose this seat and its
            collateral. If the circle never fills, you can take everything back after the deadline.
          </span>
        }
        confirmLabel="Approve and join"
        pendingLabel={tx.phase === "confirming" ? "Waiting for the network…" : "Confirm in your wallet…"}
        pending={tx.busy}
        error={tx.error}
      />

      {tx.phase === "error" && !confirming && (
        <p className="mt-3 rounded-xl border border-clay/30 bg-clay/[0.07] p-3 text-sm text-clay">
          {tx.error}
        </p>
      )}
    </div>
  );
}
