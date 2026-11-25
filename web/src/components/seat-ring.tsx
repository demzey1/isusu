"use client";

import { formatUsdt } from "@/lib/format";
import { seatState, type CircleDetail, type SeatState } from "@/lib/types";

import { UsdtLogo } from "./usdt-logo";

const SEAT_STYLE: Record<SeatState, string> = {
  empty: "border-2 border-dashed border-ink/25 bg-cream text-ink/35 hover:border-marigold hover:text-ink",
  taken: "border border-ink/20 bg-ink text-cream",
  paid: "border border-moss/30 bg-moss text-cream",
  late: "border border-clay/40 bg-clay text-cream",
  defaulted: "border border-clay/30 bg-clay/15 text-clay",
};

const SEAT_LABEL: Record<SeatState, string> = {
  empty: "open",
  taken: "taken, not paid yet",
  paid: "paid this round",
  late: "late this round",
  defaulted: "defaulted",
};

export function SeatRing({
  detail,
  now,
  selected,
  onSelect,
  className = "",
}: {
  detail: CircleDetail;
  now: number;
  selected?: number | null;
  onSelect?: (slot: number) => void;
  className?: string;
}) {
  const { view, seats } = detail;
  const started = view.joined === view.slots;
  const recipient = started && !view.finished && !view.cancelled ? view.round : 0;
  const payouts = seats.filter((seat) => (seat.member?.received ?? 0n) > 0n).length;
  const joinable = Boolean(onSelect) && !started && !view.finished && !view.cancelled && now <= Number(view.joinDeadline) && now > 0;
  const size = view.slots > 6 ? "h-9 w-9 text-[0.65rem] sm:h-11 sm:w-11 sm:text-[0.72rem]" : "h-12 w-12 text-xs sm:h-14 sm:w-14 sm:text-sm";

  return (
    <div className={`relative mx-auto aspect-square w-full max-w-[24rem] sm:max-w-[26rem] ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="42.5"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="0.45"
          strokeDasharray="0.6 2.4"
          strokeLinecap="round"
          className="text-ink"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-[47%] w-[47%] flex-col items-center justify-center rounded-full border border-ink/[0.08] bg-cream/70 px-2 text-center">
          {view.cancelled ? (
            <>
              <span className="text-[0.6rem] uppercase tracking-[0.16em] text-ink/40">Cancelled</span>
              <span className="mt-1 font-display text-lg leading-tight text-ink sm:text-xl">Full refunds</span>
            </>
          ) : view.finished ? (
            <>
              <span className="text-[0.6rem] uppercase tracking-[0.16em] text-ink/40">Complete</span>
              <span className="mt-1 font-display text-lg leading-tight text-ink sm:text-xl">
                {payouts} {payouts === 1 ? "payout" : "payouts"}
              </span>
            </>
          ) : started ? (
            <>
              <span className="text-[0.6rem] uppercase tracking-[0.16em] text-ink/40">
                Round {view.round} of {view.slots}
              </span>
              <span className="mt-1 flex items-baseline gap-1">
                <UsdtLogo size={14} />
                <span className="tnum font-mono text-xl font-medium leading-none text-ink sm:text-2xl">
                  {formatUsdt(view.contribution * BigInt(view.active))}
                </span>
              </span>
              <span className="mt-1 text-[0.6rem] text-ink/40">
                {view.active} paying · seat {recipient} gets it
              </span>
            </>
          ) : (
            <>
              <span className="text-[0.6rem] uppercase tracking-[0.16em] text-ink/40">Seats taken</span>
              <span className="mt-0.5 tnum font-mono text-2xl font-medium leading-none text-ink sm:text-3xl">
                {view.joined}
                <span className="text-ink/30">/{view.slots}</span>
              </span>
              <span className="mt-1 text-[0.6rem] text-ink/40">
                {view.finished ? "refunded" : `${formatUsdt(view.contribution * BigInt(view.slots))} pot`}
              </span>
            </>
          )}
        </div>
      </div>

      {seats.map((seat) => {
        const angle = ((seat.slot - 1) / view.slots) * Math.PI * 2 - Math.PI / 2;
        const left = 50 + Math.cos(angle) * 43;
        const top = 50 + Math.sin(angle) * 43;
        const state = seatState(seat, view, now);
        const isRecipient = seat.slot === recipient;
        const isSelected = selected === seat.slot;

        const interactive = joinable && state === "empty";

        return (
          <button
            key={seat.slot}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onSelect?.(seat.slot)}
            aria-label={`Seat ${seat.slot}: ${SEAT_LABEL[state]}${
              isRecipient ? ", receives the pot this round" : ""
            }`}
            aria-pressed={isSelected}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono transition duration-200 ${size} ${
              SEAT_STYLE[state]
            } ${interactive ? "cursor-pointer hover:scale-105" : "cursor-default"} ${
              isSelected ? "ring-halo border-solid border-marigold bg-marigold text-ink" : ""
            } ${isRecipient ? "ring-halo halo-pulse" : ""}`}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span className="tnum">{seat.slot}</span>
            {isRecipient && (
              <span className="absolute -bottom-1.5 rounded-full bg-marigold px-1.5 py-[1px] text-[0.5rem] font-semibold uppercase tracking-wider text-ink">
                pot
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function RingLegend({ className = "" }: { className?: string }) {
  const items: { label: string; className: string }[] = [
    { label: "Open", className: "border-2 border-dashed border-ink/30 bg-cream" },
    { label: "Taken", className: "bg-ink" },
    { label: "Paid", className: "bg-moss" },
    { label: "Late", className: "bg-clay" },
    { label: "Defaulted", className: "border border-clay/40 bg-clay/15" },
    { label: "Gets the pot", className: "bg-marigold" },
  ];
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.68rem] text-ink/50 ${className}`}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${item.className}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
