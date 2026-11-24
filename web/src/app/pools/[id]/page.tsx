import type { Metadata } from "next";

import { PoolDetail } from "@/components/pool-detail";

export const metadata: Metadata = {
  title: "Circle — Isusu",
  description: "The seats, the round and the payout order, straight from the contract.",
};

export default async function PoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PoolDetail id={Number(id)} />;
}
