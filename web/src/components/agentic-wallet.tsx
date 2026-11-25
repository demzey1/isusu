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
  const tone = state === "warn" ? "text-clay" : state === "ok" ? "text-ink" : "text-secondary";
  return (
    <div className="rounded-xl border border-line bg-cream px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">{label}</dt>
      <dd className={`tnum mt-1 truncate font-mono text-[13px] ${tone}`} title={value}>
        {value}
      </dd>
    </div>
  );
}

function WalletChecks({ address }: { address: Address }) {
  const { data, isLoading, isError } = useAgenticWalletChecks(address);
  const gridClass = "grid grid-cols-3 gap-2 sm:max-w-[19rem]";

  if (isLoading) {
    return (
      <dl className={gridClass}>
        {["Agent ID", "USDT", "Allowance"].map((label) => (
          <CheckTile key={label} label={label} value="Checking" />
        ))}
      </dl>
    );
  }

  if (isError || !data) {
    return (
      <dl className={gridClass}>
        <CheckTile label="Checks" value="Unavailable" state="warn" />
      </dl>
    );
  }

  return (
    <dl className={gridClass}>
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
    <section className="border-b border-line bg-cream" aria-label="Agentic Wallet">
      <div className="container-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="agentic-wallet-address"
            className="block text-xs font-semibold uppercase tracking-[0.08em] text-secondary"
          >
            Your Agentic Wallet address
          </label>
          <input
            id="agentic-wallet-address"
            value={draft}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Public address"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid}
            className="mt-2 w-full min-w-0 rounded-xl border border-line bg-cream px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-secondary focus:border-marigold"
          />
          {invalid ? (
            <p className="mt-2 text-[13px] text-clay" role="alert">
              Enter a valid BSC address.
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-secondary">
              Public address only. Nothing is connected or signed.
            </p>
          )}
        </div>

        {address ? (
          <WalletChecks address={address} />
        ) : (
          <p className="text-[13px] leading-relaxed text-secondary lg:max-w-[19rem]">
            Add your address to see the read-only chain checks.
          </p>
        )}
      </div>
    </section>
  );
}
