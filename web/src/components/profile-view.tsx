"use client";

import Link from "next/link";
import type { Address } from "viem";

import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { formatUsdt } from "@/lib/format";
import { useNow, useProfile } from "@/lib/hooks";
import { circleStatus, STATUS_LABEL, type CircleStatus } from "@/lib/types";

const CHIP: Record<CircleStatus, string> = {
  open: "border-marigold/50 bg-marigold/20 text-ink",
  active: "border-ink/20 bg-ink/[0.06] text-ink/70",
  finished: "border-ink/15 bg-ink/[0.05] text-ink/55",
  cancelled: "border-clay/25 bg-clay/[0.08] text-clay",
  expired: "border-clay/25 bg-clay/[0.08] text-clay",
};

export function ProfileView({ address }: { address: Address }) {
  const now = useNow();
  const { entries, stats, isLoading, isError } = useProfile(address);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Link
        href="/pools"
        className="inline-flex items-center gap-1.5 text-sm text-ink/45 transition hover:text-ink"
      >
        <ArrowRight className="h-4 w-4 rotate-180" /> All circles
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/45">
            On-chain record
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.1rem,4.5vw,3.3rem)] font-semibold leading-[1.0] tracking-[-0.04em]">
            Circle history
          </h1>
          <p className="mt-2 break-anywhere font-mono text-xs text-ink/45">{address}</p>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Circles joined", value: String(stats.circles), tone: "text-ink" },
          { label: "Completed", value: String(stats.completed), tone: "text-ink" },
          { label: "Defaults", value: String(stats.defaults), tone: stats.defaults ? "text-clay" : "text-ink" },
          { label: "Pots received", value: `${formatUsdt(stats.received)}`, tone: "text-ink" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-ink/[0.09] bg-white/45 p-4">
            <dt className="text-[0.62rem] uppercase tracking-[0.12em] text-ink/35">{stat.label}</dt>
            <dd className={`tnum mt-1 font-mono text-xl ${stat.tone}`}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {stats.refundable > 0n && (
        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-marigold/40 bg-marigold/[0.12] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Ready to withdraw</p>
            <p className="tnum mt-0.5 font-mono text-xl text-ink">{formatUsdt(stats.refundable)} USDT</p>
          </div>
          <p className="text-xs leading-relaxed text-ink/60">
            Open the circle below and copy the withdraw request. Money is always pulled by you.
          </p>
        </div>
      )}

      <div className="mt-8 flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">Seats</h2>
        <p className="text-xs text-ink/35">Newest first</p>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-24 animate-pulse rounded-2xl bg-ink/[0.05]" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-4 rounded-2xl border border-clay/30 bg-clay/[0.06] p-5 text-sm text-ink/65">
          Could not read the contract right now. Check the RPC and try again.
        </div>
      ) : entries.length === 0 ? (
        <div className="dot-field-fine mt-4 rounded-card border border-dashed border-ink/15 bg-white/30 px-6 py-14 text-center">
          <div className="mx-auto max-w-sm text-ink">
            <p className="font-display text-xl font-semibold">No seats in this record.</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/55">
              This wallet has not joined a circle on this contract yet.
            </p>
            <Link
              href="/pools"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Browse circles <ArrowRight />
            </Link>
          </div>
        </div>
      ) : (
        <ol className="mt-4 space-y-3">
          {entries.map((entry) => {
            const status = circleStatus(entry.view, now || Math.floor(Date.now() / 1000));
            const net = entry.member.received - entry.member.deposited;
            const settled = status === "finished" || status === "cancelled";
            const showCredit = settled && entry.member.credit > 0n;
            const showNet = settled && !showCredit && net !== 0n;
            return (
              <li key={entry.id}>
                <Link
                  href={`/pools/${entry.id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-ink/[0.09] bg-white/45 p-4 transition hover:border-ink/20 hover:bg-white/70 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-mono text-sm ${
                        entry.member.defaulted
                          ? "border border-clay/40 bg-clay/15 text-clay"
                          : entry.member.paid
                            ? "bg-ink text-cream"
                            : "border border-ink/20 bg-cream text-ink/60"
                      }`}
                    >
                      {entry.member.slot}
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg font-semibold tracking-[-0.01em]">
                          Circle #{entry.id}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] ${CHIP[status]}`}
                        >
                          {STATUS_LABEL[status]}
                        </span>
                        {entry.member.defaulted && (
                          <span className="rounded-full bg-clay/[0.12] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-clay">
                            Defaulted
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/45">
                        Seat {entry.member.slot} · {formatUsdt(entry.view.contribution)} USDT each round ·{" "}
                        {entry.view.slots} seats
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-6 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-[0.6rem] uppercase tracking-[0.1em] text-ink/30">Paid in / out</p>
                      <p className="tnum font-mono text-xs text-ink/65">
                        {formatUsdt(entry.member.deposited)} / {formatUsdt(entry.member.received)}
                      </p>
                      {showCredit && (
                        <p className="tnum mt-0.5 font-mono text-[0.68rem] text-marigold">
                          {formatUsdt(entry.member.credit)} to withdraw
                        </p>
                      )}
                      {showNet && (
                        <p className="tnum mt-0.5 font-mono text-[0.68rem] text-ink/35">
                          {net > 0n ? "+" : ""}
                          {formatUsdt(net)} net
                        </p>
                      )}
                    </div>
                    <ArrowUpRight className="mb-1 h-4 w-4 shrink-0 text-ink/30 transition group-hover:text-ink" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
