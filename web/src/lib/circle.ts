import type { CircleView } from "./types";

/** Collateral for a seat: contribution x (slots - slot). */
export function collateralFor(view: CircleView, slot: number): bigint {
  return view.contribution * BigInt(view.slots - slot);
}

/** What a member pays on joining: round 1 plus collateral. */
export function joinCost(view: CircleView, slot: number): bigint {
  return view.contribution + collateralFor(view, slot);
}

/** What the member in `slot` takes home, ignoring defaults. */
export function payoutFor(view: CircleView): bigint {
  return view.contribution * BigInt(view.slots);
}

/** Rounds a member pays in after their payout. */
export function roundsAfterPayout(view: CircleView, slot: number): number {
  return view.slots - slot;
}

/**
 * Rough time until a seat's payout, measured from "now".
 * Before the circle fills the start is unknown, so only the wait after
 * filling is shown by callers.
 */
export function payoutDelaySeconds(view: CircleView, slot: number): number {
  return (slot - 1) * Number(view.roundDuration);
}
