import Link from "next/link";

import { ISUSU_ADDRESS, isConfigured } from "@/lib/config";

import { BnbLogo } from "./bnb-logo";
import { Wordmark } from "./logo";
import { RiskStrip } from "./risk-note";

const LINKS = [
  { href: "/pools", label: "Browse circles" },
  { href: "/pools/create", label: "Start a circle" },
  { href: "/rules", label: "The rules" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink text-cream">
      <div className="container-shell py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="min-w-0">
            <Wordmark className="text-cream" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/75">
              A savings circle in code. Everyone pays the same, everyone takes the pot once, and the
              terms cannot change.
            </p>
            <p className="mt-4 flex items-center gap-2 text-[13px] text-cream/70">
              <BnbLogo size={16} />
              Built on BNB Chain. Settled in USDT.
            </p>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cream/55">
                Contract
              </p>
              {isConfigured ? (
                <a
                  href={`https://bscscan.com/address/${ISUSU_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="scroll-box mt-2 inline-block max-w-full font-mono text-[13px] leading-6 text-cream underline underline-offset-4 hover:text-marigold"
                >
                  {ISUSU_ADDRESS}
                </a>
              ) : (
                <p className="mt-2 text-[13px] text-cream/70">Contract address not set</p>
              )}
            </div>
          </div>

          <nav aria-label="Footer">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cream/55">
              Explore
            </p>
            <ul className="mt-4 space-y-3">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/80 transition-colors hover:text-marigold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cream/55">
              No admin
            </p>
            <p className="mt-4 text-sm leading-relaxed text-cream/75">
              No owner, no pause button, no way for anyone to move your money. Every payout follows
              the same code.
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-cream/70">
              Need an Agent ID? Claim it in the Binance App: Wallet, homepage banner, Agent ID.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <RiskStrip />
          <div className="mt-6 flex flex-col gap-2 text-[13px] leading-relaxed text-cream/70 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Isusu. A tool, not a financial institution.</p>
            <p className="font-mono">No seed phrases. No private keys. Ever.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
