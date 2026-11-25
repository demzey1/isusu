const POINTS = [
  "Miss a round before your payout and you lose that seat and its collateral.",
  "If someone defaults, the circle still pays every seat, but top-ups can arrive at the end.",
  "Seats are final once the circle starts. No exits or swaps.",
  "If the circle does not fill by its deadline, anyone can cancel it and every member takes back what they put in.",
];

export function RiskStrip() {
  return (
    <aside
      className="rounded-xl border border-clay/35 bg-clay/[0.12] px-4 py-3.5"
      aria-label="Risk warning"
    >
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-marigold">
        Risk warning
      </p>
      <p className="mt-1.5 text-[0.8rem] leading-relaxed text-cream/75">
        Rotating savings carry risk. {POINTS.join(" ")} Only use money you can leave in the circle
        until it ends. This is not a deposit or an investment product.
      </p>
    </aside>
  );
}
