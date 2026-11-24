"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWriteContract } from "wagmi";
import type { TransactionReceipt } from "viem";

import { friendlyError } from "./errors";

export type TxRequest = Parameters<ReturnType<typeof useWriteContract>["writeContractAsync"]>[0];

export type TxStep = {
  /** Shown in the confirm panel, e.g. "Approve 300 USDT". */
  label: string;
  request: TxRequest;
};

type TxState = {
  phase: "idle" | "signing" | "confirming" | "done" | "error";
  message: string;
  hash?: `0x${string}`;
  error?: string;
  receipt?: TransactionReceipt;
};

const IDLE: TxState = { phase: "idle", message: "" };

export function useTx() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TxState>(IDLE);

  const reset = useCallback(() => setState(IDLE), []);

  const run = useCallback(
    async (steps: TxStep[]): Promise<TransactionReceipt | null> => {
      let receipt: TransactionReceipt | null = null;
      try {
        for (const step of steps) {
          setState({ phase: "signing", message: step.label });
          const hash = await writeContractAsync(step.request as never);
          setState({ phase: "confirming", message: step.label, hash });
          receipt = await publicClient!.waitForTransactionReceipt({ hash });
          if (receipt.status === "reverted") {
            throw new Error("The transaction was rejected on-chain. Nothing changed.");
          }
        }
        setState({ phase: "done", message: "Done", receipt: receipt ?? undefined });
        await queryClient.invalidateQueries();
        return receipt;
      } catch (error) {
        setState({
          phase: "error",
          message: "",
          error: friendlyError(error),
        });
        return null;
      }
    },
    [publicClient, queryClient, writeContractAsync],
  );

  const busy = state.phase === "signing" || state.phase === "confirming";
  return { ...state, busy, run, reset };
}

/**
 * USDT on BNB Chain is an ordinary ERC-20, but some wallets and nodes keep a
 * stale non-zero allowance. Exact approvals only: when the allowance is short
 * we reset it to zero first, then approve the precise amount.
 */
export function approvalSteps({
  allowance,
  amount,
  approve,
  label,
}: {
  allowance: bigint | undefined;
  amount: bigint;
  approve: (amount: bigint) => TxRequest;
  label: (amount: bigint) => string;
}): TxStep[] {
  if (allowance !== undefined && allowance >= amount) return [];
  const steps: TxStep[] = [];
  if (allowance !== undefined && allowance > 0n) {
    steps.push({ label: "Reset the old USDT approval to 0", request: approve(0n) });
  }
  steps.push({ label: label(amount), request: approve(amount) });
  return steps;
}
