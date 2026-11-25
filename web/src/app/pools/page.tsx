"use client";

import { useMemo, useState } from "react";

import { ButtonLink } from "@/components/button";
import { ArrowUpRight } from "@/components/icons";
import { PoolCard } from "@/components/pool-card";
import { ISUSU_ADDRESS, isConfigured } from "@/lib/config";
import { useNow, usePools } from "@/lib/hooks";
import { circleStatus, type CircleStatus } from "@/lib/types";

type Filter = "all" | "open" | "active" | "finished";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Filling up" },
  { key: "active", label: "In progress" },
  { key: "finished", label: "Completed" },
];

function matches(status: CircleStatus, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "open") return status === "open" || status === "expired";
  if (filter === "active") return status === "active";
  return status === "finished" || status === "cancelled";
}

export default function PoolsPage() {
  const now = useNow();
  const { pools, count, isLoading, isError, refetch } = usePools();
  const [filter, setFilter] = useState<Filter>("all");

  const withStatus = useMemo(
    () =>
      pools.map((pool) => ({
        ...pool,
        status: circleStatus(pool.view, now || Math.floor(Date.now() / 1000)),
      })),
    [pools, now],
  );

  const visible = withStatus.filter((pool) => matches(pool.status, filter));
  const openCount = withStatus.filter((pool) => pool.status === "open").length;
  const activeCount = withStatus.filter((pool) => pool.status === "active").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/45">
            Circles
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.0] tracking-[-0.04em]">
            Find your people. Take your turn.
          </h1>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink/60">
            Every circle here is live on-chain. Open one to see the seats, the cost and the payout
            order.
          </p>
        </div>
        <ButtonLink href="/pools/create" className="shrink-0">
          Start a circle <ArrowUpRight />
        </ButtonLink>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 border-y border-ink/[0.08] py-3">
        {FILTERS.map((item) => {
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={active}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                active ? "bg-ink text-cream" : "text-ink/55 hover:bg-ink/[0.05] hover:text-ink"
              }`}
            >
              {item.label}
              {item.key === "open" && openCount > 0 && (
                <span className={`tnum ml-1.5 font-mono text-xs ${active ? "text-marigold" : "text-ink/45"}`}>
                  {openCount}
                </span>
              )}
              {item.key === "active" && activeCount > 0 && (
                <span className={`tnum ml-1.5 font-mono text-xs ${active ? "text-marigold" : "text-ink/40"}`}>
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
        <span className="ml-auto hidden text-xs text-ink/35 sm:block">
          {count} {count === 1 ? "circle" : "circles"} on this contract
        </span>
      </div>

      {!isConfigured ? (
        <EmptyState />
      ) : isError ? (
        <div className="mt-8 rounded-card border border-clay/30 bg-clay/[0.06] p-6">
          <p className="font-display text-xl font-semibold">Could not reach the chain</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            The RPC did not answer. Check your connection or the configured RPC URL.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream"
          >
            Try again
          </button>
        </div>
      ) : isLoading && pools.length === 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-[21rem] animate-pulse rounded-card border border-ink/[0.08] bg-white/40"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState filtered={filter !== "all"} onReset={() => setFilter("all")} />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((pool) => (
            <PoolCard key={pool.id} id={pool.id} view={pool.view} seats={pool.seats} now={now} />
          ))}
        </div>
      )}

      <p className="mt-10 break-anywhere font-mono text-[0.65rem] text-ink/30">
        Contract {ISUSU_ADDRESS}
      </p>
    </div>
  );
}

function EmptyState({ filtered = false, onReset }: { filtered?: boolean; onReset?: () => void }) {
  return (
    <div className="mt-8 rounded-card border border-dashed border-ink/15 bg-white/30 px-6 py-16 text-center">
      <div className="mx-auto max-w-sm text-ink">
        <p className="font-display text-2xl font-semibold tracking-[-0.02em]">
          {filtered ? "Nothing in this view." : "No circles yet."}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          {filtered
            ? "Try another filter."
            : "Open the first circle for five people you trust."}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          {filtered && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink/70 transition hover:border-ink/30 hover:text-ink"
            >
              Show all
            </button>
          )}
          <ButtonLink href="/pools/create">
            Start a circle <ArrowUpRight />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
