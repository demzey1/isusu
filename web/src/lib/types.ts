import type { Address } from "viem";

/** Mirrors Isusu.CircleView. */
export type CircleView = {
  creator: Address;
  contribution: bigint;
  roundDuration: bigint;
  joinDeadline: bigint;
  deadline: bigint;
  pot: bigint;
  pool: bigint;
  slots: number;
  joined: number;
  active: number;
  round: number;
  finished: boolean;
  cancelled: boolean;
};

/** Mirrors Isusu.Member. */
export type MemberView = {
  slot: number;
  defaulted: boolean;
  paid: boolean;
  credit: bigint;
  deposited: bigint;
  received: bigint;
};

export type Seat = {
  slot: number;
  owner?: Address;
  member?: MemberView;
};

export type CircleDetail = {
  id: number;
  view: CircleView;
  seats: Seat[];
};

export type CircleStatus = "open" | "expired" | "active" | "finished" | "cancelled";

export type SeatState = "empty" | "taken" | "paid" | "late" | "defaulted";

export function circleStatus(view: CircleView, now: number): CircleStatus {
  if (view.cancelled) return "cancelled";
  if (view.finished) return "finished";
  if (view.joined < view.slots) {
    return now > Number(view.joinDeadline) ? "expired" : "open";
  }
  return "active";
}

export function seatState(
  seat: Seat,
  view: CircleView,
  now: number,
): SeatState {
  if (!seat.owner) return "empty";
  if (seat.member?.defaulted) return "defaulted";
  // Round 0 means the circle hasn't started: the round-1 payment bought the
  // seat, it isn't a round payment, so the seat reads as taken, not paid.
  if (view.round > 0 && seat.member?.paid) return "paid";
  if (
    view.joined === view.slots &&
    !view.finished &&
    !view.cancelled &&
    now > Number(view.deadline)
  ) {
    return "late";
  }
  return "taken";
}

export const STATUS_LABEL: Record<CircleStatus, string> = {
  open: "Filling up",
  expired: "Missed its deadline",
  active: "In progress",
  finished: "Completed",
  cancelled: "Refunded",
};
