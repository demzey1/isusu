"use client";

import { countdown, pad, shortCountdown } from "@/lib/format";

export function Countdown({
  target,
  now,
  doneLabel = "Closed",
  className = "",
}: {
  target: bigint | number;
  now: number;
  doneLabel?: string;
  className?: string;
}) {
  if (!now) return <span className={`tnum font-mono ${className}`}>—</span>;
  const at = Number(target);
  return (
    <span className={`tnum font-mono ${className}`}>
      {now >= at ? doneLabel : shortCountdown(at, now)}
    </span>
  );
}

export function CountdownBlocks({
  target,
  now,
  doneLabel = "Time is up",
}: {
  target: bigint | number;
  now: number;
  doneLabel?: string;
}) {
  if (!now) {
    return <p className="font-mono text-sm text-ink/40">—</p>;
  }
  const at = Number(target);
  const { diff, days, hours, minutes, seconds, done } = countdown(at, now);

  if (done) {
    return <p className="text-sm font-medium text-clay">{doneLabel}</p>;
  }

  const parts =
    diff >= 86400
      ? [
          { value: pad(days), label: days === 1 ? "day" : "days" },
          { value: pad(hours), label: "hrs" },
          { value: pad(minutes), label: "min" },
        ]
      : [
          { value: pad(hours), label: "hrs" },
          { value: pad(minutes), label: "min" },
          { value: pad(seconds), label: "sec" },
        ];

  return (
    <div className="flex items-end gap-2" aria-live="off">
      {parts.map((part, index) => (
        <div key={part.label} className="flex items-end gap-2">
          <div className="text-center">
            <span className="tnum block font-mono text-2xl font-medium leading-none text-ink sm:text-3xl">
              {part.value}
            </span>
            <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.14em] text-ink/40">
              {part.label}
            </span>
          </div>
          {index < parts.length - 1 && (
            <span className="pb-4 font-mono text-xl leading-none text-ink/20">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
