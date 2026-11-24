import { BaseError, ContractFunctionRevertedError } from "viem";

const MESSAGES: Record<string, string> = {
  NotAgentHolder: "This wallet doesn't hold an Agent ID yet.",
  UnknownCircle: "That circle doesn't exist.",
  ZeroContribution: "The contribution has to be more than zero.",
  BadSlotCount: "A circle needs between 2 and 20 seats.",
  BadRoundDuration: "That round length is outside the allowed range.",
  BadJoinDeadline: "Pick a join deadline between 1 and 14 days from now.",
  CircleFull: "Every seat is taken.",
  CircleFinished: "This circle has already closed.",
  NotStarted: "The circle hasn't filled yet.",
  BadSlot: "That seat doesn't exist.",
  SlotTaken: "Someone just took that seat. Pick another.",
  AlreadyMember: "This wallet already holds a seat in this circle.",
  NotMember: "This wallet isn't in this circle.",
  AlreadyPaid: "You've already paid for this round.",
  NotOverdue: "This round isn't overdue yet.",
  NotFinished: "The circle hasn't finished yet.",
  NothingToWithdraw: "There's nothing left to withdraw.",
  JoinClosed: "The join deadline has passed.",
  JoinStillOpen: "The circle can still fill, so it can't be cancelled yet.",
  ERC20InsufficientBalance: "Not enough USDT in this wallet.",
  ERC20InsufficientAllowance: "Approve USDT first, then try again.",
};

function findRevertName(error: unknown): string | undefined {
  if (error instanceof BaseError) {
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      return reverted.data?.errorName;
    }
  }
  return undefined;
}

/** Turns wallet + contract errors into something a person can act on. */
export function friendlyError(error: unknown): string {
  const name = findRevertName(error);
  if (name && MESSAGES[name]) return MESSAGES[name];

  if (error instanceof BaseError) {
    const text = `${error.shortMessage} ${error.details ?? ""}`;
    if (/user rejected|denied transaction/i.test(text)) return "You cancelled the request in your wallet.";
    if (/insufficient funds/i.test(text)) return "Not enough funds in this wallet to cover the network fee.";
    if (/chain mismatch|does not match the target chain/i.test(text)) {
      return "Your wallet is on a different network. Switch it to BNB Chain and try again.";
    }
    return error.shortMessage;
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Nothing was sent, so you can try again.";
}
