import { Info } from "./icons";

const POINTS = [
  "Miss a round before your payout and you lose that seat and its collateral.",
  "If someone defaults, the circle still pays everyone back, but top-ups can arrive at the end, not instantly.",
  "Seats are final once the circle starts. There are no exits or swaps.",
  "If the circle doesn't fill by its deadline, you can cancel it and take back everything you put in.",
];

export function RiskNote({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`rounded-2xl border border-clay/25 bg-clay/[0.055] ${compact ? "p-4" : "p-5 sm:p-6"}`}
      aria-label="Risk warning"
    >
      <p className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-clay">
        <Info className="h-4 w-4" />
        Before you put money in
      </p>
      <p className={`mt-2 max-w-3xl text-ink/80 ${compact ? "text-sm" : "text-[0.95rem] leading-relaxed"}`}>
        A circle only works if everyone keeps paying. You can lose money if you miss a round before
        your payout, and a default can delay part of a refund to the end of the circle.
      </p>
      {!compact && (
        <ul className="mt-3 grid gap-2 text-[0.9rem] leading-relaxed text-ink/70 sm:grid-cols-2">
          {POINTS.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-clay/70" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-ink/50">
        Only join with money you can leave in the circle until it ends. Nothing here is a bank
        deposit or an investment product.
      </p>
    </aside>
  );
}

export function RiskStrip() {
  return (
    <p className="text-xs leading-relaxed text-ink/55">
      <span className="font-semibold text-clay">Risk warning:</span> rotating savings carry risk. Missing
      a round before your payout forfeits your seat and collateral. Top-ups after a default can arrive at
      the end of the circle. Only use money you can leave for the full term.
    </p>
  );
}
