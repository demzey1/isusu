import Link from "next/link";

export const btnBase =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marigold disabled:pointer-events-none disabled:opacity-45";

export const btnPrimary = `${btnBase} bg-marigold text-ink hover:opacity-90`;

export const btnGhost = `${btnBase} bg-transparent px-2 text-ink underline underline-offset-4 hover:text-secondary`;

export const btnDarkGhost = `${btnBase} bg-transparent px-2 text-cream underline underline-offset-4 hover:text-marigold`;

export const btnQuiet = `${btnBase} bg-transparent px-2 text-secondary underline underline-offset-4 hover:text-ink`;

export const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]";

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
  const style = variant === "ghost" ? btnGhost : variant === "dark" ? btnDarkGhost : btnPrimary;
  return (
    <Link href={href} className={`${style} ${className}`}>
      {children}
    </Link>
  );
}
