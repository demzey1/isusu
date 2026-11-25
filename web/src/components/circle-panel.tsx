"use client";

import { circleStatus, type CircleDetail } from "@/lib/types";

import { JoinPanel } from "./join-panel";
import { RoundPanel } from "./round-panel";

export function CirclePanel({
  detail,
  now,
  selected,
  onSelect,
}: {
  detail: CircleDetail;
  now: number;
  selected: number | null;
  onSelect: (slot: number | null) => void;
}) {
  const status = circleStatus(detail.view, now || Math.floor(Date.now() / 1000));

  if (status === "open") {
    return <JoinPanel detail={detail} selected={selected} onSelect={onSelect} />;
  }

  return <RoundPanel detail={detail} now={now} />;
}
