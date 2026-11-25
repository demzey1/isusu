"use client";

import { useMemo, useState } from "react";

import { btnPrimary, ButtonLink } from "@/components/button";
import { ArrowUpRight } from "@/components/icons";
import { PoolRow } from "@/components/pool-row";
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
    <div className="container-shell section-shell">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="label">Circles</p>
          <h1 className="mt-3 max-w-2xl">Find your people. Take your turn.</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-secondary">
            Every circle here is live on-chain. Open one to see the seats, the cost and the payout
            order.
          </p>
        </div>
        <ButtonLink href="/pools/create" className="w-full sm:w-auto">
          Start a circle <ArrowUpRight />
        </ButtonLink>
      </div>

      {isConfigured && count > 0 && !isError ? (
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line pb-2">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            const itemCount =
              item.key === "open" ? openCount : item.key === "active" ? activeCount : undefined;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={active}
                className={`inline-flex h-12 items-center gap-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-ink underline decoration-marigold decoration-2 underline-offset-8"
                    : "text-secondary hover:text-ink"
                }`}
              >
                {item.label}
                {itemCount ? (
                  <span className="tnum font-mono text-sm text-secondary">{itemCount}</span>
                ) : null}
              </button>
            );
          })}
          <span className="ml-auto hidden text-sm text-secondary sm:block">
            <span className="tnum font-mono">{count}</span>{" "}
            {count === 1 ? "circle" : "circles"} on this contract
          </span>
        </div>
      ) : null}

      <div className="mt-8">
        {!isConfigured ? (
          <EmptyState />
        ) : isError ? (
          <div className="rounded-xl border border-clay bg-cream p-6">
            <p className="label text-clay">Chain unavailable</p>
            <p className="mt-2 font-display text-2xl font-normal text-ink">
              Could not reach the chain
            </p>
            <p className="mt-2 text-base leading-relaxed text-secondary">
              The RPC did not answer. Check your connection or the configured RPC URL.
            </p>
            <button type="button" onClick={() => refetch()} className={`mt-5 ${btnPrimary}`}>
              Try again
            </button>
          </div>
        ) : isLoading && pools.length === 0 ? (
          <p className="rounded-xl border border-line bg-cream p-8 text-center text-base text-secondary">
            Reading circles from the chain.
          </p>
        ) : count === 0 ? (
          <EmptyState />
        ) : visible.length === 0 ? (
          <EmptyState filtered onReset={() => setFilter("all")} />
        ) : (
          <div className="space-y-3">
            {visible.map((pool) => (
              <PoolRow key={pool.id} id={pool.id} view={pool.view} now={now} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <p className="label">Contract</p>
        {isConfigured ? (
          <a
            href={`https://bscscan.com/address/${ISUSU_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="scroll-box mt-2 inline-block max-w-full font-mono text-[13px] text-secondary underline underline-offset-4 hover:text-ink"
          >
            {ISUSU_ADDRESS}
          </a>
        ) : (
          <p className="mt-2 text-sm text-secondary">Contract address not set</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ filtered = false, onReset }: { filtered?: boolean; onReset?: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-cream p-8 text-center sm:p-12">
      <p className="font-display text-2xl font-normal text-ink">
        {filtered ? "Nothing in this view." : "No circles yet. Start the first one."}
      </p>
      {filtered ? (
        <p className="mt-2 text-base text-secondary">Try another filter.</p>
      ) : null}
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {filtered && onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-12 items-center px-2 text-sm font-medium text-secondary underline underline-offset-4 hover:text-ink"
          >
            Show all
          </button>
        ) : null}
        <ButtonLink href="/pools/create">
          Start a circle <ArrowUpRight />
        </ButtonLink>
      </div>
    </div>
  );
}
