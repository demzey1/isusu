import type { Metadata } from "next";
import Link from "next/link";
import { isAddress } from "viem";

import { ProfileView } from "@/components/profile-view";

export const metadata: Metadata = {
  title: "Circle record | Isusu",
  description: "Every seat this wallet has taken, read straight from the contract.",
};

export default async function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  if (!isAddress(address)) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-clay">Not an address</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.03em]">
          That link doesn&apos;t point to a wallet.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/55">
          A profile link looks like <span className="font-mono text-xs">/profile/0x…</span>.
        </p>
        <Link
          href="/pools"
          className="mt-6 inline-flex rounded-full bg-marigold px-5 py-3 text-sm font-semibold text-ink"
        >
          Browse circles
        </Link>
      </div>
    );
  }

  return <ProfileView address={address} />;
}
