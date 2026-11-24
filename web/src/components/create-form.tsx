"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, usePublicClient, useSwitchChain } from "wagmi";
import { bsc } from "wagmi/chains";
import { parseEventLogs } from "viem";

import { isusuAbi } from "@/lib/abi";
import { ISUSU_ADDRESS } from "@/lib/config";
import { formatDuration, formatUsdt, parseUsdt } from "@/lib/format";
import { useAgentId } from "@/lib/hooks";
import { useTx } from "@/lib/tx";

import { AgentIdNeeded } from "./agent-gate";
import { ConfirmDialog } from "./confirm-dialog";
import { ArrowRight, Check, Spinner } from "./icons";
import { UsdtLogo } from "./usdt-logo";
import { WalletButton } from "./wallet-button";

const ROUND_OPTIONS = [
  { days: 1, label: "Daily", hint: "Fast, needs a payment every day" },
  { days: 7, label: "Weekly", hint: "The usual rhythm for a circle" },
  { days: 30, label: "Monthly", hint: "Matches a monthly salary" },
];

const JOIN_OPTIONS = [
  { days: 1, label: "1 day" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
];

export function CreateForm() {
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const client = usePublicClient();
  const agent = useAgentId(address);
  const tx = useTx();

  const [slots, setSlots] = useState<5 | 10>(5);
  const [amount, setAmount] = useState("");
  const [roundDays, setRoundDays] = useState(7);
  const [joinDays, setJoinDays] = useState(7);
  const [confirming, setConfirming] = useState(false);
  const [creating, setCreating] = useState(false);

  const contribution = parseUsdt(amount);
  const validAmount = contribution !== null && contribution > 0n;
  const wrongChain = Boolean(address) && chainId !== bsc.id;

  const summary = useMemo(() => {
    if (!contribution || contribution <= 0n) return null;
    return {
      pot: contribution * BigInt(slots),
      firstSeat: contribution + contribution * BigInt(slots - 1),
      lastSeat: contribution,
      collateral: contribution * BigInt(slots - 1),
    };
  }, [contribution, slots]);

  async function create() {
    if (!contribution || !client) return;
    setCreating(true);
    try {
      const block = await client.getBlock();
      const window = BigInt(joinDays * 86400);
      // Stay safely inside the contract's 1–14 day window.
      const buffer = joinDays === 1 ? 600n : joinDays === 14 ? -600n : 0n;
      const joinDeadline = block.timestamp + window + buffer;

      const receipt = await tx.run([
        {
          label: "Open the circle",
          request: {
            address: ISUSU_ADDRESS as `0x${string}`,
            abi: isusuAbi,
            functionName: "createCircle" as const,
            args: [contribution, slots, BigInt(roundDays * 86400), joinDeadline] as const,
          },
        },
      ]);

      if (!receipt) {
        setCreating(false);
        return;
      }

      let id: number | null = null;
      try {
        const parsed = parseEventLogs({
          abi: isusuAbi,
          eventName: "CircleCreated",
          logs: receipt.logs,
        });
        if (parsed[0]) id = Number(parsed[0].args.id);
      } catch {
        id = null;
      }
      if (id === null) {
        const count = await client.readContract({
          address: ISUSU_ADDRESS,
          abi: isusuAbi,
          functionName: "circleCount",
        });
        id = Number(count);
      }

      setConfirming(false);
      router.push(`/pools/${id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <div className="rounded-card border border-ink/[0.1] bg-white/55 p-5 shadow-[0_18px_40px_-34px_rgba(20,17,15,0.5)] sm:p-7">
        <fieldset>
          <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            1 · How many people
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {([5, 10] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSlots(size)}
                aria-pressed={slots === size}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  slots === size
                    ? "border-marigold bg-marigold/15 shadow-[0_10px_24px_-20px_rgba(20,17,15,0.7)]"
                    : "border-ink/12 bg-cream hover:border-ink/25"
                }`}
              >
                <span className="tnum block font-mono text-2xl text-ink">{size}</span>
                <span className="mt-0.5 block text-sm text-ink/55">people, {size} rounds</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            2 · Each person pays
          </legend>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-ink/15 bg-cream px-4 py-3 focus-within:border-indigo/50">
            <UsdtLogo size={20} />
            <input
              inputMode="decimal"
              placeholder="100"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="tnum w-full bg-transparent font-mono text-2xl text-ink outline-none placeholder:text-ink/25"
              aria-label="Contribution in USDT per round"
            />
            <span className="text-sm text-ink/40">USDT</span>
          </div>
          <p className="mt-2 text-xs text-ink/40">
            The same amount every round. Must be more than 0, with up to 18 decimals.
          </p>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            3 · How often
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
            4 · Time to fill the circle
          </legend>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {JOIN_OPTIONS.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setJoinDays(option.days)}
                aria-pressed={joinDays === option.days}
                className={`rounded-xl border px-2 py-2.5 text-sm transition ${
                  joinDays === option.days
                    ? "border-indigo bg-indigo text-cream"
                    : "border-ink/12 bg-cream text-ink/65 hover:border-ink/25"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink/40">
            If the circle isn&apos;t full by then, anyone can cancel it and every member takes back
            everything they put in. The contract allows 1 to 14 days.
          </p>
        </fieldset>

        <div className="mt-7 border-t border-ink/10 pt-5">
          {!address ? (
            <>
              <p className="text-sm leading-relaxed text-ink/60">
                Connect a wallet to open a circle. Opening one costs no USDT — only the network fee.
              </p>
              <div className="mt-3">
                <WalletButton />
              </div>
            </>
          ) : agent.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-ink/45">
              <Spinner /> Checking your Agent ID…
            </p>
          ) : agent.isError ? (
            <p className="rounded-xl border border-clay/30 bg-clay/[0.07] p-3 text-sm text-clay">
              Couldn&apos;t read your Agent ID from the chain. Check the RPC and reload.
            </p>
          ) : !agent.data || agent.data === 0n ? (
            <AgentIdNeeded />
          ) : wrongChain ? (
            <div className="rounded-xl border border-clay/30 bg-clay/[0.07] p-3 text-sm text-clay">
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
          ) : (
            <button
              type="button"
              disabled={!validAmount || tx.busy}
              onClick={() => {
                tx.reset();
                setConfirming(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-6 py-4 text-[0.95rem] font-semibold text-ink transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Open the circle <ArrowRight />
            </button>
          )}
          <p className="mt-2 text-center text-[0.68rem] text-ink/35">
            No USDT is taken to create. You still choose a seat like everyone else.
          </p>
        </div>
      </div>

      <aside className="rounded-card border border-ink/[0.1] bg-ink p-5 text-cream sm:p-7 lg:sticky lg:top-24">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cream/40">
          What you&apos;re opening
        </p>

        {summary ? (
          <>
            <p className="mt-3 flex items-baseline gap-1.5">
              <UsdtLogo size={20} />
              <span className="tnum font-mono text-4xl font-medium leading-none tracking-[-0.03em]">
                {formatUsdt(summary.pot)}
              </span>
            </p>
            <p className="mt-1 text-sm text-cream/50">the pot, every round</p>

            <dl className="mt-6 space-y-3 border-t border-cream/10 pt-5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-cream/50">People</dt>
                <dd className="tnum font-mono text-cream/90">{slots}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-cream/50">Each pays</dt>
                <dd className="tnum font-mono text-cream/90">{formatUsdt(contribution ?? 0n)} USDT</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-cream/50">Every</dt>
                <dd className="text-cream/90">{formatDuration(roundDays * 86400)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-cream/50">Join window</dt>
                <dd className="text-cream/90">{formatDuration(joinDays * 86400)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-cream/50">Whole circle runs</dt>
                <dd className="text-cream/90">{formatDuration(slots * roundDays * 86400)}</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl border border-cream/10 bg-cream/[0.04] p-4 text-xs leading-relaxed text-cream/55">
              <p className="font-semibold text-cream/80">Seat 1 pays the most up front</p>
              <p className="mt-1">
                {formatUsdt(summary.firstSeat)} USDT today and takes the {formatUsdt(summary.pot)} pot
                first. The last seat pays just {formatUsdt(summary.lastSeat)} USDT and waits{" "}
                {formatDuration((slots - 1) * roundDays * 86400)}.
              </p>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-cream/50">
            Enter a contribution to see the pot, the collateral for each seat, and how long the circle
            runs.
          </p>
        )}

        <ul className="mt-6 space-y-2 border-t border-cream/10 pt-5 text-xs leading-relaxed text-cream/55">
          {[
            "No admin. The contract has no owner and no pause.",
            "Payouts are automatic as each round settles.",
            "Miss a round before your payout and you lose your seat.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marigold" />
              {item}
            </li>
          ))}
        </ul>
      </aside>

      <ConfirmDialog
        open={confirming}
        onClose={() => {
          if (tx.busy || creating) return;
          setConfirming(false);
          tx.reset();
        }}
        onConfirm={create}
        title="Open this circle?"
        description="This creates the circle on-chain. It does not take any USDT from you."
        rows={[
          { label: "People", value: `${slots}` },
          { label: "Each pays", value: `${formatUsdt(contribution ?? 0n)} USDT` },
          { label: "Pot", value: `${formatUsdt(summary?.pot ?? 0n)} USDT`, strong: true },
          { label: "Every", value: formatDuration(roundDays * 86400) },
          { label: "Join closes", value: `In ${formatDuration(joinDays * 86400)}` },
        ]}
        note="Terms are fixed once the circle is created. You will not be able to change the size, contribution, round length or deadline later."
        confirmLabel="Create circle"
        pendingLabel={tx.phase === "confirming" ? "Waiting for the network…" : "Confirm in your wallet…"}
        pending={tx.busy || creating}
        error={tx.error}
      />
    </div>
  );
}
