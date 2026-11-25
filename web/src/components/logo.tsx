import Link from "next/link";

/** A ring of dots: the shared mark of the whole site. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  const seats = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return { cx: 16 + Math.cos(angle) * 10.5, cy: 16 + Math.sin(angle) * 10.5 };
  });
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      {seats.map((seat, i) => (
        <circle
          key={i}
          cx={seat.cx}
          cy={seat.cy}
          r={i === 0 ? 3.1 : 2.4}
          fill={i === 0 ? "var(--color-marigold)" : "var(--color-ink)"}
        />
      ))}
      <circle cx="16" cy="16" r="3.2" fill="none" stroke="var(--color-ink)" strokeWidth="1.6" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Isusu home">
      <LogoMark />
      <span className="font-display text-[1.45rem] font-semibold leading-none tracking-[-0.03em]">Isusu</span>
    </Link>
  );
}
