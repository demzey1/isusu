import Link from "next/link";

export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[0.95rem] font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marigold disabled:pointer-events-none disabled:opacity-45";

export const btnPrimary = `${btnBase} bg-marigold text-ink shadow-[0_10px_24px_-14px_rgba(20,17,15,0.55)] hover:-translate-y-0.5 hover:brightness-[1.03] active:translate-y-0`;

export const btnGhost = `${btnBase} border border-ink/15 bg-cream/70 text-ink hover:border-ink/35 hover:bg-cream`;

export const btnDarkGhost = `${btnBase} border border-cream/20 bg-transparent text-cream hover:border-cream/40 hover:bg-cream/[0.06]`;

export const btnQuiet = `${btnBase} px-3 py-2 text-sm font-medium text-ink/70 hover:text-ink`;

export const chip =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.72rem] font-medium tracking-wide";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "dark";
  className?: string;
}) {
  const style =
    variant === "ghost" ? btnGhost : variant === "dark" ? btnDarkGhost : btnPrimary;
  return (
    <Link href={href} className={`${style} ${className}`}>
      {children}
    </Link>
  );
}
