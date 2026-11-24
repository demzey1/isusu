"use client";

import { useCallback, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { bsc } from "wagmi/chains";

import { AGENT_ID_ADDRESS, ISUSU_ADDRESS, isConfigured } from "@/lib/config";
import { friendlyError } from "@/lib/errors";
import { shortAddress } from "@/lib/format";
import { useAgentId, useMounted } from "@/lib/hooks";

import { Check, Copy, Spinner, Wallet } from "./icons";

export function WalletButton() {
  const mounted = useMounted();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const agent = useAgentId(address);

  const copy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice("Couldn't copy. Select the address instead.");
    }
  }, [address]);

  if (!mounted) {
    return <div className="h-11 w-28 animate-pulse rounded-full bg-ink/[0.07]" aria-hidden="true" />;
  }

  if (!isConnected) {
    const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            injected
              ? connect(
                  { connector: injected },
                  {
                    onError: (e) => {
                      const message = friendlyError(e);
                      setNotice(
                        /provider|not found|no injected/i.test(message)
                          ? "No wallet found. Open this page in your wallet's browser, or install a wallet extension."
                          : message,
                      );
                    },
                  },
                )
              : setNotice("No wallet found in this browser.")
          }
          disabled={isPending}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-marigold px-4 text-sm font-semibold text-ink transition hover:brightness-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:opacity-60"
        >
          {isPending ? <Spinner /> : <Wallet />}
          <span className="hidden xs:inline">Connect wallet</span>
          <span className="xs:hidden">Connect</span>
        </button>
        {(notice ?? error) && (
          <p className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-ink/10 bg-cream p-3 text-xs leading-relaxed text-ink/70 shadow-xl">
            {notice ?? "That didn't work. Try opening this page in your wallet's browser."}
          </p>
        )}
        {!isConfigured && (
          <p className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-clay/30 bg-cream p-3 text-xs text-clay shadow-xl">
            No circle contract is configured for this build.
          </p>
        )}
      </div>
    );
  }

  const wrongChain = chainId !== bsc.id;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setNotice(null);
        }}
        aria-expanded={open}
        className={`inline-flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition ${
          wrongChain
            ? "border-clay/40 bg-clay/10 text-clay"
            : "border-ink/15 bg-cream text-ink hover:border-ink/30"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            wrongChain ? "bg-clay" : agent.data && agent.data > 0n ? "bg-moss" : "bg-marigold"
          }`}
        />
        <span className="tnum font-mono text-[0.78rem]">{shortAddress(address)}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close wallet menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-ink/20"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-3xl border border-ink/10 bg-cream p-4 shadow-[0_24px_60px_-30px_rgba(20,17,15,0.55)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">Wallet</p>
            <button
              type="button"
              onClick={copy}
              className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-xl bg-ink/[0.04] px-3 py-2 text-left font-mono text-xs text-ink/80 hover:bg-ink/[0.07]"
            >
              <span className="truncate">{address}</span>
              {copied ? <Check className="h-4 w-4 shrink-0 text-moss" /> : <Copy className="h-4 w-4 shrink-0" />}
            </button>

            <div className="mt-3 rounded-2xl border border-ink/10 p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
                Agent ID
              </p>
              {agent.isLoading ? (
                <p className="mt-1 text-sm text-ink/50">Checking…</p>
              ) : agent.data && agent.data > 0n ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-moss">
                  <Check className="h-4 w-4" /> Verified holder
                </p>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-ink/65">
                  No Agent ID in this wallet. Claim it in the Binance app: Wallet &gt; homepage banner
                  &gt; Agent ID.
                </p>
              )}
            </div>

            {wrongChain && (
              <button
                type="button"
                onClick={() => switchChain({ chainId: bsc.id })}
                disabled={switching}
                className="mt-3 w-full rounded-full bg-clay px-4 py-2.5 text-sm font-semibold text-cream"
              >
                {switching ? "Switching…" : "Switch to BNB Chain"}
              </button>
            )}

            {notice && <p className="mt-3 text-xs text-clay">{notice}</p>}

            <button
              type="button"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="mt-3 w-full rounded-full border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/30 hover:text-ink"
            >
              Disconnect
            </button>

            <p className="mt-3 break-anywhere font-mono text-[0.62rem] text-ink/30">
              Circle contract {ISUSU_ADDRESS.slice(0, 10)}… · Agent ID{" "}
              {AGENT_ID_ADDRESS.slice(0, 10)}…
            </p>
          </div>
        </>
      )}
    </div>
  );
}
