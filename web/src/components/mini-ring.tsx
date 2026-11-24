import { seatState, type CircleView, type Seat } from "@/lib/types";

/** A small, read-only version of the seat ring for pool cards. */
export function MiniRing({
  view,
  seats,
  now,
  size = 104,
}: {
  view: CircleView;
  seats: Seat[];
  now: number;
  size?: number;
}) {
  const started = view.joined === view.slots;
  const recipient = started && !view.finished && !view.cancelled ? view.round : 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" className="text-ink" />
        {seats.map((seat) => {
          const angle = ((seat.slot - 1) / view.slots) * Math.PI * 2 - Math.PI / 2;
          const cx = 50 + Math.cos(angle) * 43;
          const cy = 50 + Math.sin(angle) * 43;
          const state = seatState(seat, view, now);
          const fill =
            state === "empty"
              ? "var(--color-cream)"
              : state === "paid"
                ? "var(--color-moss)"
                : state === "late"
                  ? "var(--color-clay)"
                  : state === "defaulted"
                    ? "rgba(200,85,61,0.25)"
                    : "var(--color-ink)";
          return (
            <g key={seat.slot}>
              {recipient === seat.slot && (
                <circle cx={cx} cy={cy} r="7.4" fill="var(--color-marigold)" opacity="0.35" />
              )}
              <circle
                cx={cx}
                cy={cy}
                r="4.6"
                fill={fill}
                stroke={
                  recipient === seat.slot
                    ? "var(--color-marigold)"
                    : state === "empty"
                      ? "rgba(20,17,15,0.28)"
                      : "none"
                }
                strokeWidth={recipient === seat.slot ? "1.8" : "0.8"}
                strokeDasharray={state === "empty" ? "1.6 1.6" : undefined}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tnum font-mono text-sm font-medium leading-none text-ink">
          {view.joined}/{view.slots}
        </span>
        <span className="mt-0.5 text-[0.5rem] uppercase tracking-[0.12em] text-ink/40">
          {view.finished ? (view.cancelled ? "refunded" : "done") : "seats"}
        </span>
      </div>
    </div>
  );
}
