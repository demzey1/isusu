"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Wordmark } from "./logo";
import { WalletButton } from "./wallet-button";

const LINKS = [
  { href: "/pools", label: "Pools" },
  { href: "/pools/create", label: "Start a circle", mobile: true },
  { href: "/rules", label: "Rules" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-ink/[0.08] bg-cream">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Wordmark />

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-2.5 py-2 text-[0.82rem] font-medium transition sm:px-3 sm:text-sm ${
                  active ? "bg-indigo/[0.07] text-indigo" : "text-ink/60 hover:text-ink"
                } ${link.href === "/pools/create" ? "hidden sm:inline-flex" : ""}`}
              >
                {link.href === "/pools/create" ? (
                  <>
                    <span className="hidden sm:inline">{link.label}</span>
                    <span className="sm:hidden">Create</span>
                  </>
                ) : (
                  link.label
                )}
              </Link>
            );
          })}
          <span className="mx-0.5 hidden h-5 w-px bg-ink/10 sm:block" />
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
