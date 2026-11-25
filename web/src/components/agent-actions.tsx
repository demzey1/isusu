"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Check, Copy } from "./icons";

/**
 * The only "action" surface in the app. It never connects a wallet: it hands
 * the user a plain request to paste into their agent, which previews and
 * confirms every step in the Binance App.
 */
export function AgentActions({
  prompt,
  amountLabel,
}: {
  prompt: string;
  amountLabel?: string;
}) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  // A notice never survives a route change.
  useEffect(() => {
    setCopied(false);
    setFailed(false);
  }, [pathname]);

  // And it clears itself after a few seconds.
  useEffect(() => {
    if (!copied && !failed) return;
    const timer = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [copied, failed]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setFailed(false);
      setCopied(true);
    } catch {
      setCopied(false);
      setFailed(true);
    }
  }

  return (
    <aside className="rounded-card border border-ink/[0.1] bg-ink p-5 text-cream sm:p-6">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cream/40">
        Agent actions
      </p>
      <p className="mt-1 text-sm leading-relaxed text-cream/60">
        Copy this into your agent. It previews each step and waits for you.
      </p>

      {amountLabel && (
        <p className="mt-3 flex items-baseline justify-between gap-3 border-y border-cream/10 py-2 text-sm">
          <span className="text-cream/50">Exact cost</span>
          <span className="tnum font-mono text-cream">{amountLabel}</span>
        </p>
      )}

      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-anywhere rounded-xl bg-cream/[0.06] p-3 font-mono text-[0.72rem] leading-relaxed text-cream/80">
        {prompt}
      </pre>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-full bg-marigold px-4 py-2.5 text-sm font-semibold text-ink transition hover:brightness-[1.03]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy request"}
        </button>
        <span className="text-[0.68rem] leading-relaxed text-cream/40">
          Needs Developer Mode on in the Binance App.
        </span>
      </div>

      {failed && (
        <p className="mt-2 text-xs text-clay" role="alert">
          Copy failed. Select the text and copy it manually.
        </p>
      )}
    </aside>
  );
}
