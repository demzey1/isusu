"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getAddress, isAddress, type Address } from "viem";

import { formatUsdt } from "@/lib/format";
import { useAgenticWalletChecks } from "@/lib/hooks";

const STORAGE_KEY = "isusu.agenticWalletAddress";

type AgenticWalletValue = {
  address?: Address;
  setAddress: (address?: Address) => void;
  loaded: boolean;
};

const AgenticWalletContext = createContext<AgenticWalletValue | null>(null);

export function AgenticWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddressState] = useState<Address | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isAddress(saved)) setAddressState(getAddress(saved));
      else if (saved) localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be blocked. The field simply starts empty.
    }
    setLoaded(true);
  }, []);

  function setAddress(next?: Address) {
    setAddressState(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The value still works for this page view.
    }
  }

  return (
    <AgenticWalletContext.Provider value={{ address, setAddress, loaded }}>
      {children}
    </AgenticWalletContext.Provider>
  );
}

export function useAgenticWallet(): AgenticWalletValue {
  const value = useContext(AgenticWalletContext);
  if (!value) throw new Error("useAgenticWallet must be used inside AgenticWalletProvider");
  return value;
}

function CheckTile({
  label,
  value,
  state = "idle",
}: {
  label: string;
  value: string;
  state?: "idle" | "ok" | "warn";
}) {
  const tone =
    state === "warn" ? "text-clay" : state === "ok" ? "text-ink" : "text-ink/45";
  return (
    <div className="rounded-xl border border-ink/10 bg-cream px-2.5 py-2">
      <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-ink/40">
        {label}
      </dt>
      <dd className={`tnum mt-0.5 truncate font-mono text-xs ${tone}`} title={value}>
        {value}
      </dd>
    </div>
  );
}

function WalletChecks({ address }: { address: Address }) {
  const { data, isLoading, isError } = useAgenticWalletChecks(address);

  if (isLoading) {
    return (
      <dl className="grid grid-cols-3 gap-2 sm:w-[19rem]">
        {["Agent ID", "USDT", "Allowance"].map((label) => (
          <CheckTile key={label} label={label} value="..." />
        ))}
      </dl>
    );
  }

  if (isError || !data) {
    return (
      <dl className="grid grid-cols-3 gap-2 sm:w-[19rem]">
        <CheckTile label="Checks" value="Unavailable" state="warn" />
      </dl>
    );
  }

  return (
    <dl className="grid grid-cols-3 gap-2 sm:w-[19rem]">
      <CheckTile
        label="Agent ID"
        value={data.agentIdBalance > 0n ? "Held" : "None"}
        state={data.agentIdBalance > 0n ? "ok" : "warn"}
      />
      <CheckTile label="USDT" value={formatUsdt(data.usdtBalance)} state="ok" />
      <CheckTile label="Allowance" value={formatUsdt(data.allowance)} state="ok" />
    </dl>
  );
}

/** One address field for the whole app. It never connects or signs anything. */
export function AgenticWalletField() {
  const { address, setAddress, loaded } = useAgenticWallet();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (loaded && address) setDraft(address);
  }, [loaded, address]);

  const trimmed = draft.trim();
  const invalid = trimmed.length > 0 && !isAddress(trimmed);

  function onChange(value: string) {
    setDraft(value);
    const next = value.trim();
    if (isAddress(next)) setAddress(getAddress(next));
    else setAddress(undefined);
  }

  return (
    <section className="border-b border-ink/[0.08] bg-white/40" aria-label="Agentic Wallet">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="agentic-wallet-address"
            className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/45"
          >
            Your Agentic Wallet address
          </label>
          <input
            id="agentic-wallet-address"
            value={draft}
            onChange={(event) => onChange(event.target.value)}
            placeholder="0x..."
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid}
            className="mt-1 w-full min-w-0 rounded-xl border border-ink/15 bg-cream px-3 py-2 font-mono text-xs text-ink outline-none transition placeholder:text-ink/25 focus:border-marigold sm:text-sm"
          />
          {invalid ? (
            <p className="mt-1 text-[0.68rem] text-clay" role="alert">
              Enter a valid BSC address.
            </p>
          ) : (
            <p className="mt-1 text-[0.68rem] text-ink/40">
              Public address only. Nothing is connected or signed.
            </p>
          )}
        </div>

        {address ? (
          <WalletChecks address={address} />
        ) : (
          <p className="text-xs leading-relaxed text-ink/40 sm:w-[19rem]">
            Add your address to see the read-only chain checks.
          </p>
        )}
      </div>
    </section>
  );
}
