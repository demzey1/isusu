"use client";

import type { Address } from "viem";

import { circleStatus, type CircleDetail } from "@/lib/types";

import { JoinPanel } from "./join-panel";
import { RoundPanel } from "./round-panel";

export function CirclePanel({
  detail,
  now,
  selected,
  onSelect,
  address,
}: {
  detail: CircleDetail;
  now: number;
  selected: number | null;
  onSelect: (slot: number | null) => void;
  address?: Address;
}) {
  const status = circleStatus(detail.view, now || Math.floor(Date.now() / 1000));

  if (status === "open") {
    return <JoinPanel detail={detail} now={now} selected={selected} onSelect={onSelect} />;
  }

  return <RoundPanel detail={detail} now={now} address={address} />;
}
