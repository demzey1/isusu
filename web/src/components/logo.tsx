import Link from "next/link";

/** A text-only mark. It carries no numbers or sample values. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`font-display text-[1rem] font-normal leading-none tracking-[-0.01em] ${className}`}
    >
      Isusu
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center font-display text-[1.5rem] font-normal leading-none tracking-[-0.01em] ${className}`}
      aria-label="Isusu home"
    >
      Isusu
    </Link>
  );
}
