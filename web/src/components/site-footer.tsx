import Link from "next/link";

import { BnbLogo } from "./bnb-logo";
import { LogoMark } from "./logo";
import { RiskStrip } from "./risk-note";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-cream">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8" />
              <span className="font-display text-2xl font-semibold tracking-[-0.03em]">Isusu</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
              A savings circle in code. Everyone pays the same, everyone takes the pot once, and the
              terms cannot change.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-cream/45">
              <BnbLogo size={14} />
              Built on BNB Chain. Settled in USDT.
            </p>
          </div>

          <nav className="text-sm" aria-label="Footer">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cream/35">
              Explore
            </p>
            <ul className="mt-3 space-y-2.5">
              {[
                { href: "/pools", label: "Browse circles" },
                { href: "/pools/create", label: "Start a circle" },
                { href: "/rules", label: "The rules" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-cream/70 transition hover:text-marigold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cream/35">
              No admin
            </p>
            <p className="mt-3 text-sm leading-relaxed text-cream/60">
              No owner, no pause button, no way for anyone to move your money. Every payout follows
              the same code.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-cream/40">
              Need an Agent ID? Claim it in the Binance App: Wallet, homepage banner, Agent ID.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-cream/10 pt-6">
          <RiskStrip />
          <div className="mt-5 flex flex-col gap-2 text-xs text-cream/35 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Isusu. A tool, not a financial institution.</p>
            <p className="font-mono">No seed phrases. No private keys. Ever.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
