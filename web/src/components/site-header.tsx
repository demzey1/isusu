"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Wordmark } from "./logo";

const LINKS = [
  { href: "/pools", label: "Circles" },
  { href: "/pools/create", label: "Start" },
  { href: "/rules", label: "Rules" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-ink/[0.08] bg-cream">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <Wordmark />

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {LINKS.map((link) => {
            const active =
              link.href === "/pools"
                ? pathname === "/pools" ||
                  (pathname.startsWith("/pools/") && !pathname.startsWith("/pools/create"))
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-2.5 py-2 text-[0.82rem] font-medium transition sm:px-3 sm:text-sm ${
                  active
                    ? "bg-marigold/25 text-ink"
                    : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
