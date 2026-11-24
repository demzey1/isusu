import Link from "next/link";

import { formatUsdt, formatDuration } from "@/lib/format";
import { circleStatus, STATUS_LABEL, type CircleView, type Seat } from "@/lib/types";

import { Countdown } from "./countdown";
import { ArrowUpRight } from "./icons";
import { MiniRing } from "./mini-ring";
import { UsdtLogo } from "./usdt-logo";

const CHIP: Record<string, string> = {
  open: "border-indigo/20 bg-indigo/[0.07] text-indigo",
  active: "border-moss/25 bg-moss/[0.09] text-moss",
  finished: "border-ink/15 bg-ink/[0.05] text-ink/55",
  cancelled: "border-clay/25 bg-clay/[0.08] text-clay",
  expired: "border-clay/25 bg-clay/[0.08] text-clay",
};

export function PoolCard({
  id,
  view,
  seats,
  now,
}: {
  id: number;
  view: CircleView;
  seats: Seat[];
  now: number;
}) {
  const status = circleStatus(view, now);
  const payout = view.contribution * BigInt(view.slots);

  return (
    <Link
      href={`/pools/${id}`}
      className="group flex flex-col rounded-card border border-ink/[0.09] bg-white/45 p-5 transition duration-300 hover:-translate-y-1 hover:border-ink/20 hover:bg-white/70 hover:shadow-[0_24px_50px_-32px_rgba(20,17,15,0.45)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${CHIP[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
          <p className="mt-3 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-ink/35">
            Circle #{id}
          </p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <UsdtLogo size={18} className="translate-y-[2px]" />
            <span className="tnum font-mono text-[1.85rem] font-medium leading-none tracking-[-0.03em] sm:text-[2.1rem]">
              {formatUsdt(view.contribution)}
            </span>
          </p>
          <p className="mt-1 text-sm text-ink/50">each round</p>
        </div>
        <MiniRing view={view} seats={seats} now={now} size={96} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-ink/[0.08] pt-4 text-sm">
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.12em] text-ink/35">Pot</dt>
          <dd className="tnum mt-0.5 font-mono text-[0.95rem] text-ink/80">{formatUsdt(payout)} USDT</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.12em] text-ink/35">Every</dt>
          <dd className="mt-0.5 text-[0.95rem] text-ink/80">
            {formatDuration(Number(view.roundDuration))}
          </dd>
        </div>
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.12em] text-ink/35">Seats</dt>
          <dd className="tnum mt-0.5 font-mono text-[0.95rem] text-ink/80">
            {view.joined}/{view.slots}
          </dd>
        </div>
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.12em] text-ink/35">
            {status === "open" ? "Join closes in" : status === "active" ? "Round ends in" : "Deadline"}
          </dt>
          <dd className="mt-0.5 text-[0.95rem] text-ink/80">
            {status === "open" ? (
              <Countdown target={view.joinDeadline} now={now} doneLabel="Closed" />
            ) : status === "active" ? (
              <Countdown target={view.deadline} now={now} doneLabel="Overdue" />
            ) : status === "expired" ? (
              <span className="text-clay">Passed</span>
            ) : (
              <span className="text-ink/50">—</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-ink/[0.08] pt-3 text-[0.8rem] font-medium text-indigo">
        <span>
          {status === "open"
            ? "See the seats"
            : status === "active"
              ? "View this round"
              : status === "expired"
                ? "Cancel and refund"
                : "See the record"}
        </span>
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}
