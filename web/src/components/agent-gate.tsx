import { Info } from "./icons";

export function AgentIdNeeded() {
  return (
    <div className="rounded-2xl border border-marigold/40 bg-marigold/[0.1] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Info className="h-4 w-4 text-clay" />
        An Agent ID is needed to join or start a circle.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        Claim your Agent ID in the Binance app: Wallet &gt; homepage banner &gt; Agent ID.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ink/45">
        This wallet doesn&apos;t hold one yet. The check reads your balance directly from the Agent ID
        contract.
      </p>
    </div>
  );
}
