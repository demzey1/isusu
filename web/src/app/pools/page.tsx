"use client";

import { useMemo, useState } from "react";

import { ButtonLink } from "@/components/button";
import { ArrowUpRight } from "@/components/icons";
import { PoolCard } from "@/components/pool-card";
import { RiskNote } from "@/components/risk-note";
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
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-indigo/70">
            Circles
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.0] tracking-[-0.04em]">
            Find your people. Take your turn.
          </h1>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink/60">
            Every circle below is live on-chain. Open the ring to see who&apos;s already in, what each
            seat costs, and when the pot lands.
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
                <span className={`tnum ml-1.5 font-mono text-xs ${active ? "text-marigold" : "text-indigo/60"}`}>
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
        <div className="mt-8 rounded-card border border-clay/30 bg-clay/[0.06] p-6">
          <p className="font-display text-xl font-semibold">No contract address configured</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            Set <code className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_ISUSU_ADDRESS</code>{" "}
            to a deployed Isusu contract, then reload. Nothing is mocked here.
          </p>
        </div>
      ) : isError ? (
        <div className="mt-8 rounded-card border border-clay/30 bg-clay/[0.06] p-6">
          <p className="font-display text-xl font-semibold">Couldn&apos;t reach the chain</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            The RPC didn&apos;t answer. Check your connection or the configured RPC URL.
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
        <div className="dot-field-fine mt-8 rounded-card border border-dashed border-ink/15 bg-white/30 px-6 py-16 text-center text-ink/20">
          <div className="mx-auto max-w-sm text-ink">
            <p className="font-display text-2xl font-semibold tracking-[-0.02em]">
              {filter === "all" ? "No circles yet." : "Nothing in this view."}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/55">
              {filter === "all"
                ? "Every circle starts with one person opening it. Yours can be the first on this contract."
                : "Try another filter, or open a new circle of your own."}
            </p>
            <div className="mt-5 flex justify-center">
              <ButtonLink href="/pools/create">
                Start a circle <ArrowUpRight />
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((pool) => (
            <PoolCard key={pool.id} id={pool.id} view={pool.view} seats={pool.seats} now={now} />
          ))}
        </div>
      )}

      <div className="mt-10">
        <RiskNote compact />
        <p className="mt-4 break-anywhere font-mono text-[0.65rem] text-ink/30">
          Contract {ISUSU_ADDRESS}
        </p>
      </div>
    </div>
  );
}
