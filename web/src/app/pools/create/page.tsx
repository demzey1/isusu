import type { Metadata } from "next";

import { CreateForm } from "@/components/create-form";

export const metadata: Metadata = {
  title: "Start a circle | Isusu",
  description: "Open a five-seat rotating savings circle, settled in USDT.",
};

export default function CreatePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/45">
          Start a circle
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.0] tracking-[-0.04em]">
          Set the rhythm. Invite your people.
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/60">
          Pick the contribution and how often it is paid. Terms are fixed once you open it.
        </p>
      </div>

      <div className="mt-8">
        <CreateForm />
      </div>
    </div>
  );
}
