"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";

import { CirclePanel } from "@/components/circle-panel";
import { Countdown } from "@/components/countdown";
import { ArrowRight, Clock } from "@/components/icons";
import { RingLegend, SeatRing } from "@/components/seat-ring";
import { RiskNote } from "@/components/risk-note";
import { UsdtLogo } from "@/components/usdt-logo";
import { ISUSU_ADDRESS } from "@/lib/config";
import { formatDate, formatDuration, formatUsdt, shortAddress } from "@/lib/format";
import { useCircleDetail, useNow } from "@/lib/hooks";
import { circleStatus, STATUS_LABEL, type Seat } from "@/lib/types";

const CHIP: Record<string, string> = {
  open: "border-indigo/20 bg-indigo/[0.07] text-indigo",
  active: "border-moss/25 bg-moss/[0.09] text-moss",
  finished: "border-ink/15 bg-ink/[0.05] text-ink/55",
  cancelled: "border-clay/25 bg-clay/[0.08] text-clay",
  expired: "border-clay/25 bg-clay/[0.08] text-clay",
};

export function PoolDetail({ id }: { id: number }) {
  const now = useNow();
  const { address } = useAccount();
  const query = useCircleDetail(id);
  const [selected, setSelected] = useState<number | null>(null);

  const detail = query.data;
  const status = detail && now ? circleStatus(detail.view, now) : null;

  // If someone else took the seat you were looking at, clear it.
  useEffect(() => {
    if (!detail || !selected) return;
    const seat = detail.seats.find((entry) => entry.slot === selected);
    if (seat?.owner || detail.view.finished) setSelected(null);
  }, [detail, selected]);

  const paidCount = useMemo(
    () => detail?.seats.filter((seat) => seat.member?.paid).length ?? 0,
    [detail],
  );

  if (Number.isNaN(id) || id <= 0) {
    return <NotFound />;
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-4 w-28 animate-pulse rounded bg-ink/10" />
        <div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-ink/10" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-card bg-ink/[0.06]" />
          <div className="h-80 animate-pulse rounded-card bg-ink/[0.06]" />
        </div>
      </div>
    );
  }

  if (query.isError || !detail) {
    return <NotFound />;
  }

  const { view, seats } = detail;
  const seatStatus = (seat: Seat) => {
    if (!seat.owner) return { label: "Open", tone: "text-ink/35" };
    if (seat.member?.defaulted) return { label: "Defaulted", tone: "text-clay" };
    if (view.cancelled) {
      return seat.member && seat.member.credit > 0n
        ? { label: "Refund ready", tone: "text-moss" }
        : { label: "Refunded", tone: "text-ink/45" };
    }
    if (view.finished) return { label: "Finished", tone: "text-ink/45" };
    // Round 0 = still filling (or past its deadline). The round-1 payment
    // bought the seat; it wasn't a round payment.
    if (view.round === 0) return { label: "Seat held", tone: "text-ink/50" };
    if (seat.member?.paid) return { label: "Paid this round", tone: "text-moss" };
    if (now > Number(view.deadline)) return { label: "Late", tone: "text-clay" };
    return { label: "Not paid yet", tone: "text-ink/50" };
  };

  const open = status === "open";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link
        href="/pools"
        className="inline-flex items-center gap-1.5 text-sm text-ink/45 transition hover:text-ink"
      >
        <ArrowRight className="h-4 w-4 rotate-180" /> All circles
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${CHIP[status ?? "open"]}`}
            >
              {STATUS_LABEL[status ?? "open"]}
            </span>
            <span className="text-xs text-ink/35">Circle #{id}</span>
          </div>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold leading-[1.0] tracking-[-0.04em]">
            <span className="inline-flex items-baseline gap-2">
              <UsdtLogo size={26} className="translate-y-[3px]" />
              <span className="tnum font-mono text-[0.82em] font-medium">{formatUsdt(view.contribution)}</span>
            </span>
            <span className="ml-2 text-ink/45">each round</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/55">
            {open
              ? `${view.joined} of ${view.slots} seats taken. Join by ${formatDate(view.joinDeadline)} and take your turn.`
              : view.cancelled
                ? "The circle never filled. Every member can pull back their full payment."
                : view.finished
                  ? "All rounds have settled. Payouts were automatic."
                  : view.round === 0
                    ? `The circle never filled: ${view.joined} of ${view.slots} seats by the deadline.`
                    : `Round ${view.round} of ${view.slots}. ${paidCount} of ${view.active} seats have paid this round.`}
          </p>
        </div>

        <Link
          href="/pools/create"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink/70 transition hover:border-ink/30 hover:text-ink"
        >
          Open your own <ArrowRight />
        </Link>
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-ink/[0.08] py-4 sm:grid-cols-4">
        {[
          { label: "Pot", value: `${formatUsdt(view.contribution * BigInt(view.slots))} USDT` },
          { label: "Seats", value: `${view.joined} / ${view.slots}` },
          { label: "Every", value: formatDuration(Number(view.roundDuration)) },
          {
            label:
              status === "open"
                ? "Join closes"
                : status === "expired"
                  ? "Join closed"
                  : status === "cancelled"
                    ? "Cancelled"
                    : status === "finished"
                      ? "Finished"
                      : "Round ends",
            value:
              status === "open" || status === "expired"
                ? formatDate(view.joinDeadline)
                : status === "cancelled"
                  ? "Full refunds"
                  : status === "finished"
                    ? "—"
                    : formatDate(view.deadline),
          },
        ].map((fact) => (
          <div key={fact.label}>
            <dt className="text-[0.65rem] uppercase tracking-[0.12em] text-ink/35">{fact.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink/80">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-start">
        <section className="rounded-card border border-ink/[0.1] bg-white/45 p-5 sm:p-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
                The circle
              </p>
              <p className="mt-1 text-sm text-ink/55">
                {open
                  ? "Tap an open seat to see its cost."
                  : view.cancelled
                    ? "Refunds are pulled by each member."
                    : view.finished
                      ? "Every payout in this circle has been made."
                      : view.round === 0
                        ? "The circle never filled, so no round ever started."
                        : "The marigold seat takes this round's pot."}
              </p>
            </div>
            {open && (
              <span className="flex items-center gap-1.5 rounded-full bg-indigo/[0.07] px-3 py-1 text-xs text-indigo">
                <Clock className="h-3.5 w-3.5" />
                <Countdown target={view.joinDeadline} now={now} doneLabel="Closed" />
              </span>
            )}
          </div>

          <div className="mt-4">
            <SeatRing
              detail={detail}
              now={now}
              selected={selected}
              onSelect={open ? (slot) => setSelected(slot) : undefined}
              myAddress={address}
            />
          </div>

          <RingLegend className="mt-5 justify-center" />

          {view.finished && !view.cancelled && (
            <p className="mt-4 rounded-xl bg-moss/[0.07] p-3 text-xs leading-relaxed text-moss">
              Every payout in this circle went out automatically when its round settled. There is no
              claim step.
            </p>
          )}
          {view.cancelled && (
            <p className="mt-4 rounded-xl bg-clay/[0.07] p-3 text-xs leading-relaxed text-clay">
              This circle was cancelled after its join deadline. Members withdraw their own refunds.
            </p>
          )}
          {view.pool > 0n && !view.finished && (
            <p className="mt-4 rounded-xl bg-ink/[0.035] p-3 text-xs leading-relaxed text-ink/55">
              <span className="tnum font-mono">{formatUsdt(view.pool)} USDT</span> is held back for
              compensation. It goes to members who are owed after a default, or back into refunds at the
              end.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-1 border-t border-ink/[0.08] pt-4 text-xs text-ink/40">
            <p>
              Opened by{" "}
              <span className="font-mono text-ink/60">{shortAddress(view.creator)}</span>
              {" · "}
              Join deadline {formatDate(view.joinDeadline)}
            </p>
            <p className="break-anywhere font-mono text-[0.62rem] text-ink/25">
              Contract {ISUSU_ADDRESS} · Circle {id}
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <CirclePanel
            detail={detail}
            now={now}
            selected={selected}
            onSelect={setSelected}
            address={address}
          />

          <RiskNote compact />
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
              Seats &amp; record
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
              Who&apos;s in this circle
            </h2>
          </div>
          <p className="text-xs text-ink/35">Straight from the contract</p>
        </div>

        <ol className="mt-4 divide-y divide-ink/[0.08] overflow-hidden rounded-card border border-ink/[0.1] bg-white/45">
          {seats.map((seat) => {
            const state = seatStatus(seat);
            const mine = address && seat.owner?.toLowerCase() === address.toLowerCase();
            return (
              <li key={seat.slot} className="flex items-center gap-3 px-4 py-3 sm:gap-5 sm:px-5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                    seat.owner
                      ? seat.member?.defaulted
                        ? "border border-clay/40 bg-clay/15 text-clay"
                        : seat.member?.paid && !view.finished
                          ? "bg-moss text-cream"
                          : "bg-ink text-cream"
                      : "border-2 border-dashed border-ink/20 text-ink/30"
                  }`}
                >
                  {seat.slot}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink/80">
                    {seat.owner ? (
                      <Link
                        href={`/profile/${seat.owner}`}
                        className="font-mono text-[0.8rem] underline-offset-2 hover:underline"
                      >
                        {shortAddress(seat.owner)}
                      </Link>
                    ) : (
                      <span className="text-ink/35">Open seat</span>
                    )}
                    {mine && (
                      <span className="ml-2 rounded-full bg-marigold/25 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ink/70">
                        You
                      </span>
                    )}
                  </p>
                  <p className={`mt-0.5 text-xs ${state.tone}`}>
                    {state.label}
                    {seat.member && !view.finished && seat.member.slot === view.round && !view.cancelled
                      ? " · takes this round's pot"
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[0.6rem] uppercase tracking-[0.1em] text-ink/30">If full</p>
                  <p className="tnum font-mono text-xs text-ink/65">
                    R{seat.slot} · {formatUsdt(view.contribution * BigInt(view.slots))}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-3 text-xs leading-relaxed text-ink/40">
          Payout order is fixed by seat: seat 1 in round 1, seat 2 in round 2, and so on. Seats are final
          once the circle fills. A round pays the contributions actually received; if someone defaults,
          the compensation pool tops up any shortfall at the end of the circle.
        </p>
      </section>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-clay">Not found</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.03em]">
        This circle doesn&apos;t exist.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/55">
        The contract has no circle with that number. It may not have been opened yet, or the link may be
        wrong.
      </p>
      <Link
        href="/pools"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-marigold px-5 py-3 text-sm font-semibold text-ink"
      >
        Browse circles <ArrowRight />
      </Link>
    </div>
  );
}
