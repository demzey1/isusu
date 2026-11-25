"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { executeCommand, previewCommand, type AgentStep } from "@/lib/calldata";

import { useAgenticWallet } from "./agentic-wallet";
import { btnPrimary } from "./button";
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
    <aside className="min-w-0 rounded-xl border border-line bg-ink p-5 text-cream sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cream/60">
        Agent actions
      </p>

      <p className="mt-3 text-sm leading-relaxed text-cream/80">{AGENT_WRAPPER}</p>

      {amountLabel ? (
        <p className="mt-4 flex items-baseline justify-between gap-3 border-y border-line py-3 text-sm">
          <span className="text-cream/60">Exact cost</span>
          <span className="tnum font-mono text-cream">{amountLabel}</span>
        </p>
      ) : null}

      <ol className="mt-5 space-y-5">
        {steps.map((step, index) => (
          <li key={`${step.title}-${index}`} className="min-w-0">
            <p className="text-sm font-semibold text-cream">
              Step {index + 1}: {step.title}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-cream/70">{step.detail}</p>
            <p className="scroll-box mt-2 font-mono text-[13px] text-cream/60">
              <span className="whitespace-nowrap">Contract: {step.to}</span>
            </p>
            <pre className="scroll-box mt-2 max-h-64 rounded-xl bg-cream/[0.06] p-3 font-mono text-[13px] leading-relaxed text-cream">
              <span className="whitespace-nowrap">
                {previewCommand({ wallet: address, to: step.to, inputData: step.inputData })}
                {"\n"}
                {executeCommand()}
              </span>
            </pre>
          </li>
        ))}
      </ol>

      <p className="mt-5 rounded-xl border border-line bg-cream/[0.06] p-3 text-[13px] leading-relaxed text-cream/75">
        {DAILY_LIMIT_NOTE}
      </p>

      {!address ? (
        <p className="mt-3 text-[13px] leading-relaxed text-cream/60">
          Add your Agentic Wallet address at the top to fill in --from.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={copy} className={btnPrimary}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy all"}
        </button>
        <span className="text-[13px] leading-relaxed text-cream/60">
          Preview and confirmation stay with your agent.
        </span>
      </div>

      {failed ? (
        <p className="mt-3 text-[13px] text-clay" role="alert">
          Copy failed. Select the text and copy it manually.
        </p>
      ) : null}
    </aside>
  );
}
