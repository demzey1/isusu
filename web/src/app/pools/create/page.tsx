import type { Metadata } from "next";

import { CreateForm } from "@/components/create-form";

export const metadata: Metadata = {
  title: "Start a circle | Isusu",
  description: "Open a five-seat rotating savings circle, settled in USDT.",
};

export default function CreatePage() {
  return (
    <div className="container-shell section-shell">
      <div className="max-w-2xl">
        <p className="label">Start a circle</p>
        <h1 className="mt-3">Set the rhythm. Invite your people.</h1>
        <p className="mt-4 text-base leading-relaxed text-secondary">
          Pick the contribution and how often it is paid. Terms are fixed once you open it.
        </p>
      </div>

      <div className="mt-10">
        <CreateForm />
      </div>
    </div>
  );
}
