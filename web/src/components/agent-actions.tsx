"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { executeCommand, previewCommand, type AgentStep } from "@/lib/calldata";

import { useAgenticWallet } from "./agentic-wallet";
import { Check, Copy } from "./icons";

export const AGENT_WRAPPER =
  "Use my Agentic Wallet on BSC (chain 56). Developer Mode must be on. Run these steps in order. For each step run the preview, show me the parsed transaction and any risks, wait for my yes, then run execute with the requestId. Do not skip a confirmation.";

export const DAILY_LIMIT_NOTE =
  "Set the Developer Mode daily limit in the Binance App high enough for the amount.";

/**
 * The only action surface. It never connects a wallet. It renders literal
 * Developer Mode commands, and the agent still previews and confirms each one.
 */
export function AgentActions({
  steps,
  amountLabel,
}: {
  steps: AgentStep[];
  amountLabel?: string;
}) {
  const pathname = usePathname();
  const { address } = useAgenticWallet();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copyText = useMemo(() => {
    const lines: string[] = [AGENT_WRAPPER, DAILY_LIMIT_NOTE];
    if (amountLabel) lines.push(`Amount: ${amountLabel}`);
    steps.forEach((step, index) => {
      lines.push(
        `Step ${index + 1}: ${step.title}`,
        step.detail,
        `Contract: ${step.to}`,
        previewCommand({ wallet: address, to: step.to, inputData: step.inputData }),
        executeCommand(),
      );
    });
    return lines.join("\n");
  }, [address, amountLabel, steps]);

  useEffect(() => {
    setCopied(false);
    setFailed(false);
  }, [pathname]);

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
      await navigator.clipboard.writeText(copyText);
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

      <p className="mt-2 text-sm leading-relaxed text-cream/75">{AGENT_WRAPPER}</p>

      {amountLabel && (
        <p className="mt-3 flex items-baseline justify-between gap-3 border-y border-cream/10 py-2 text-sm">
          <span className="text-cream/50">Exact cost</span>
          <span className="tnum font-mono text-cream">{amountLabel}</span>
        </p>
      )}

      <ol className="mt-4 space-y-4">
        {steps.map((step, index) => (
          <li key={`${step.title}-${index}`}>
            <p className="text-sm font-semibold text-cream">
              Step {index + 1}: {step.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-cream/55">{step.detail}</p>
            <p className="mt-1 break-anywhere font-mono text-[0.65rem] text-cream/35">
              Contract: {step.to}
            </p>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-anywhere rounded-xl bg-cream/[0.06] p-3 font-mono text-[0.72rem] leading-relaxed text-cream/80">
              {previewCommand({ wallet: address, to: step.to, inputData: step.inputData })}
              {"\n"}
              {executeCommand()}
            </pre>
          </li>
        ))}
      </ol>

      <p className="mt-4 rounded-xl border border-cream/10 p-3 text-xs leading-relaxed text-cream/60">
        {DAILY_LIMIT_NOTE}
      </p>

      {!address && (
        <p className="mt-2 text-[0.68rem] leading-relaxed text-cream/40">
          Add your Agentic Wallet address at the top to fill in --from.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-full bg-marigold px-4 py-2.5 text-sm font-semibold text-ink transition hover:brightness-[1.03]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy all"}
        </button>
        <span className="text-[0.68rem] leading-relaxed text-cream/40">
          Preview and confirmation stay with your agent.
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
