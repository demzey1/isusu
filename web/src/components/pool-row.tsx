import Link from "next/link";

import { formatDuration, formatUsdt } from "@/lib/format";
import { circleStatus, STATUS_LABEL, type CircleStatus, type CircleView } from "@/lib/types";

import { Countdown } from "./countdown";
import { ArrowUpRight } from "./icons";
import { UsdtLogo } from "./usdt-logo";

const STATUS_TONE: Record<CircleStatus, string> = {
  open: "text-ink",
  expired: "text-clay",
  active: "text-ink",
  finished: "text-secondary",
  cancelled: "text-clay",
};

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="label">{label}</p>
      <div className="mt-1 text-sm text-ink">{children}</div>
    </div>
  );
}

export function PoolRow({ id, view, now }: { id: number; view: CircleView; now: number }) {
  const status = circleStatus(view, now);
  const pot = view.contribution * BigInt(view.slots);
  const timingLabel =
    status === "open" ? "Join closes" : status === "active" ? "Round ends" : "Deadline";

  return (
    <Link
      href={`/pools/${id}`}
      className="group grid gap-5 rounded-xl border border-line bg-cream p-5 transition-colors hover:border-ink/30 lg:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(0,1fr))_auto] lg:items-center lg:gap-6"
    >
      <div className="min-w-0">
        <p className="label">Circle {id}</p>
        <div className="mt-2 flex items-center gap-2">
          <UsdtLogo size={18} className="shrink-0" />
          <span className="tnum font-mono text-2xl leading-none text-ink">
            {formatUsdt(view.contribution)}
          </span>
        </div>
        <p className="mt-1 text-sm text-secondary">each round</p>
      </div>

      <Cell label="Pot">
        <span className="tnum font-mono">{formatUsdt(pot)} USDT</span>
      </Cell>
      <Cell label="Every">{formatDuration(Number(view.roundDuration))}</Cell>
      <Cell label="Seats">
        <span className="tnum font-mono">
          {view.joined}/{view.slots}
        </span>
      </Cell>
      <Cell label={timingLabel}>
        {status === "open" ? (
          <Countdown target={view.joinDeadline} now={now} doneLabel="Closed" />
        ) : status === "active" ? (
          <Countdown target={view.deadline} now={now} doneLabel="Overdue" />
        ) : status === "expired" ? (
          <span className="text-clay">Passed</span>
        ) : (
          <span className="text-secondary">Settled</span>
        )}
      </Cell>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <span className={`text-xs font-semibold uppercase tracking-[0.08em] ${STATUS_TONE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}
