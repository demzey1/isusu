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
    <header className="sticky top-0 z-30 border-b border-line bg-cream">
      <div className="container-shell flex min-h-[4.5rem] items-center justify-between gap-4">
        <Wordmark className="shrink-0 text-ink" />

        <nav className="flex items-center gap-5 sm:gap-8" aria-label="Main">
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
                aria-current={active ? "page" : undefined}
                className={`relative py-5 text-sm font-medium transition-colors ${
                  active ? "text-ink" : "text-secondary hover:text-ink"
                }`}
              >
                {link.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-marigold"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
