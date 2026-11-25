import { encodeFunctionData, type Address, type Hex } from "viem";

import { isusuAbi, usdtAbi } from "./abi";
import { ISUSU_ADDRESS, USDT_ADDRESS } from "./config";
import { formatUsdt } from "./format";

export type AgentStep = {
  title: string;
  detail: string;
  to: Address;
  inputData: Hex;
};

export function approveCalldata(spender: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: usdtAbi,
    functionName: "approve",
    args: [spender, amount],
  });
}

export function joinCalldata(id: bigint, slot: number): Hex {
  return encodeFunctionData({
    abi: isusuAbi,
    functionName: "join",
    args: [id, slot],
  });
}

export function contributeCalldata(id: bigint): Hex {
  return encodeFunctionData({
    abi: isusuAbi,
    functionName: "contribute",
    args: [id],
  });
}

export function createCircleCalldata(
  contribution: bigint,
  roundDuration: bigint,
  joinWindow: bigint,
): Hex {
  return encodeFunctionData({
    abi: isusuAbi,
    functionName: "createCircle",
    args: [contribution, roundDuration, joinWindow],
  });
}

export function withdrawCalldata(id: bigint): Hex {
  return encodeFunctionData({
    abi: isusuAbi,
    functionName: "withdraw",
    args: [id],
  });
}

export function cancelCircleCalldata(id: bigint): Hex {
  return encodeFunctionData({
    abi: isusuAbi,
    functionName: "cancelCircle",
    args: [id],
  });
}

export function closeRoundCalldata(id: bigint): Hex {
  return encodeFunctionData({
    abi: isusuAbi,
    functionName: "closeRound",
    args: [id],
  });
}

function approveStep(amount: bigint): AgentStep {
  return {
    title: "Approve USDT",
    detail: `Allow the Isusu contract to spend exactly ${formatUsdt(amount)} USDT.`,
    to: USDT_ADDRESS,
    inputData: approveCalldata(ISUSU_ADDRESS, amount),
  };
}

function isusuStep(title: string, detail: string, inputData: Hex): AgentStep {
  return { title, detail, to: ISUSU_ADDRESS, inputData };
}

export function buildJoinSteps(args: {
  id: number;
  slot: number;
  amount: bigint;
  allowance: bigint;
}): AgentStep[] {
  const { id, slot, amount, allowance } = args;
  const steps: AgentStep[] = [];

  if (allowance < amount) steps.push(approveStep(amount));
  steps.push(
    isusuStep(
      "Join the circle",
      `Join circle ${id}, seat ${slot}.`,
      joinCalldata(BigInt(id), slot),
    ),
  );

  return steps;
}

export function buildContributeSteps(args: {
  id: number;
  amount: bigint;
  allowance: bigint;
}): AgentStep[] {
  const { id, amount, allowance } = args;
  const steps: AgentStep[] = [];

  if (allowance < amount) steps.push(approveStep(amount));
  steps.push(
    isusuStep(
      "Contribute for this round",
      `Pay ${formatUsdt(amount)} USDT to circle ${id}.`,
      contributeCalldata(BigInt(id)),
    ),
  );

  return steps;
}

export function buildCreateSteps(args: {
  contribution: bigint;
  roundSeconds: number;
  joinSeconds: number;
}): AgentStep[] {
  const { contribution, roundSeconds, joinSeconds } = args;
  return [
    isusuStep(
      "Create the circle",
      `Open a 5 seat circle at ${formatUsdt(contribution)} USDT per round.`,
      createCircleCalldata(contribution, BigInt(roundSeconds), BigInt(joinSeconds)),
    ),
  ];
}

export function buildWithdrawSteps(id: number): AgentStep[] {
  return [
    isusuStep(
      "Withdraw your balance",
      `Pull any refund, collateral or held payout from circle ${id}.`,
      withdrawCalldata(BigInt(id)),
    ),
  ];
}

export function buildCancelSteps(id: number): AgentStep[] {
  return [
    isusuStep(
      "Cancel the circle",
      `Cancel circle ${id} after its join deadline.`,
      cancelCircleCalldata(BigInt(id)),
    ),
  ];
}

export function buildCloseRoundSteps(id: number): AgentStep[] {
  return [
    isusuStep(
      "Settle the round",
      `Close the overdue round of circle ${id}.`,
      closeRoundCalldata(BigInt(id)),
    ),
  ];
}

export function previewCommand(args: {
  wallet?: Address;
  to: Address;
  inputData: Hex;
}): string {
  const from = args.wallet ?? "<wallet>";
  return `baw contract-call preview --binanceChainId 56 --from ${from} --to ${args.to} --value 0 --inputData ${args.inputData} --json`;
}

export function executeCommand(): string {
  return "baw contract-call execute --requestId <requestId> --json";
}
