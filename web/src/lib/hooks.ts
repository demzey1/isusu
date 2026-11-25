"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

import { isusuAbi } from "./abi";
import { publicClient } from "./client";
import { ISUSU_ADDRESS, isConfigured } from "./config";
import type { CircleDetail, CircleView, MemberView, Seat } from "./types";

/** A clock that follows the chain, not the laptop. Ticks between block reads. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    let base = 0;
    let measuredAt = 0;
    let cancelled = false;

    const sync = async () => {
      try {
        const block = await publicClient.getBlock({ blockTag: "latest" });
        if (cancelled) return;
        base = Number(block.timestamp);
      } catch {
        if (cancelled) return;
        base = Math.floor(Date.now() / 1000);
      }
      measuredAt = Date.now();
      setNow(base);
    };

    void sync();
    const poll = isConfigured ? setInterval(() => void sync(), 6000) : undefined;
    const tick = setInterval(() => {
      base ||= Math.floor(Date.now() / 1000);
      measuredAt ||= Date.now();
      setNow(base + Math.floor((Date.now() - measuredAt) / 1000));
    }, intervalMs);

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      clearInterval(tick);
    };
  }, [intervalMs]);

  return now;
}

function normalize(raw: {
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
}): CircleView {
  return {
    creator: raw.creator,
    contribution: raw.contribution,
    roundDuration: raw.roundDuration,
    joinDeadline: raw.joinDeadline,
    deadline: raw.deadline,
    pot: raw.pot,
    pool: raw.pool,
    slots: Number(raw.slots),
    joined: Number(raw.joined),
    active: Number(raw.active),
    round: Number(raw.round),
    finished: raw.finished,
    cancelled: raw.cancelled,
  };
}

function normalizeMember(raw: MemberView): MemberView {
  return {
    slot: Number(raw.slot),
    defaulted: raw.defaulted,
    paid: raw.paid,
    credit: raw.credit,
    deposited: raw.deposited,
    received: raw.received,
    owed: raw.owed,
  };
}

export function useCircleCount() {
  return useQuery({
    queryKey: ["circleCount", ISUSU_ADDRESS],
    enabled: isConfigured,
    queryFn: async () => {
      const count = await publicClient.readContract({
        address: ISUSU_ADDRESS,
        abi: isusuAbi,
        functionName: "circleCount",
      });
      return Number(count);
    },
  });
}

export type PoolSummary = { id: number; view: CircleView; seats: Seat[] };

/** Every circle, newest first, with just enough seat data for the mini ring. */
export function usePools() {
  const countQuery = useCircleCount();
  const count = countQuery.data ?? 0;
  const shown = Math.min(count, 24);
  const ids = useMemo(() => Array.from({ length: shown }, (_, i) => count - i), [count, shown]);

  const poolsQuery = useQuery({
    queryKey: ["pools", count, ISUSU_ADDRESS],
    enabled: isConfigured && count > 0,
    queryFn: async (): Promise<PoolSummary[]> => {
      const results = await publicClient.multicall({
        contracts: ids.map((id) => ({
          address: ISUSU_ADDRESS,
          abi: isusuAbi,
          functionName: "getCircle" as const,
          args: [BigInt(id)] as const,
        })),
        allowFailure: true,
      });
      const views = results.flatMap((result, index) =>
        result.status === "success" ? [{ id: ids[index], view: normalize(result.result) }] : [],
      );

      const calls: {
        address: `0x${string}`;
        abi: typeof isusuAbi;
        functionName: "slotOwner";
        args: readonly [bigint, number];
      }[] = [];
      for (const entry of views) {
        for (let slot = 1; slot <= entry.view.slots; slot += 1) {
          calls.push({
            address: ISUSU_ADDRESS,
            abi: isusuAbi,
            functionName: "slotOwner",
            args: [BigInt(entry.id), slot] as const,
          });
        }
      }

      const owners = calls.length
        ? await publicClient.multicall({ contracts: calls, allowFailure: true })
        : [];
      let cursor = 0;
      return views.map((entry) => {
        const seats: Seat[] = Array.from({ length: entry.view.slots }, (_, index) => {
          const result = owners[cursor];
          cursor += 1;
          const owner =
            result?.status === "success" && result.result !== "0x0000000000000000000000000000000000000000"
              ? (result.result as Address)
              : undefined;
          return { slot: index + 1, owner };
        });
        return { id: entry.id, view: entry.view, seats };
      });
    },
  });

  return {
    pools: poolsQuery.data ?? [],
    count,
    isLoading: countQuery.isLoading || (count > 0 && poolsQuery.isLoading),
    isError: countQuery.isError || poolsQuery.isError,
    refetch: async () => {
      await countQuery.refetch();
      await poolsQuery.refetch();
    },
  };
}

/** One circle with its seats and member records. */
export function useCircleDetail(id: number) {
  return useQuery({
    queryKey: ["circle", id, ISUSU_ADDRESS],
    enabled: isConfigured && Number.isFinite(id) && id > 0,
    queryFn: async (): Promise<CircleDetail> => {
      const raw = await publicClient.readContract({
        address: ISUSU_ADDRESS,
        abi: isusuAbi,
        functionName: "getCircle",
        args: [BigInt(id)],
      });
      const view = normalize(raw);
      const slots = view.slots;

      const [owners, memberTotal] = await Promise.all([
        publicClient.multicall({
          contracts: Array.from({ length: slots }, (_, index) => ({
            address: ISUSU_ADDRESS,
            abi: isusuAbi,
            functionName: "slotOwner" as const,
            args: [BigInt(id), index + 1] as const,
          })),
          allowFailure: false,
        }),
        publicClient.readContract({
          address: ISUSU_ADDRESS,
          abi: isusuAbi,
          functionName: "memberCount",
          args: [BigInt(id)],
        }),
      ]);

      const total = Number(memberTotal);
      let addresses: readonly Address[] = [];
      if (total > 0) {
        addresses = await publicClient.multicall({
          contracts: Array.from({ length: total }, (_, index) => ({
            address: ISUSU_ADDRESS,
            abi: isusuAbi,
            functionName: "memberAt" as const,
            args: [BigInt(id), BigInt(index)] as const,
          })),
          allowFailure: false,
        });
      }

      let memberRows: readonly MemberView[] = [];
      if (addresses.length > 0) {
        const results = await publicClient.multicall({
          contracts: addresses.map((address) => ({
            address: ISUSU_ADDRESS,
            abi: isusuAbi,
            functionName: "getMember" as const,
            args: [BigInt(id), address] as const,
          })),
          allowFailure: false,
        });
        memberRows = results.map((row) => normalizeMember(row));
      }

      const byAddress = new Map<string, MemberView>();
      addresses.forEach((address, index) => {
        const member = memberRows[index];
        if (member) byAddress.set(address.toLowerCase(), member);
      });

      return {
        id,
        view,
        seats: Array.from({ length: slots }, (_, index) => {
          const slot = index + 1;
          const owner = owners[index] as Address | undefined;
          const member = owner ? byAddress.get(owner.toLowerCase()) : undefined;
          return {
            slot,
            owner: owner && owner !== "0x0000000000000000000000000000000000000000" ? owner : undefined,
            member,
          };
        }),
      };
    },
  });
}

export type ProfileEntry = {
  id: number;
  view: CircleView;
  member: MemberView;
};

/** Every circle this wallet holds a seat in, newest first. */
export function useProfile(address?: Address) {
  const countQuery = useCircleCount();
  const count = countQuery.data ?? 0;
  const ids = useMemo(() => Array.from({ length: count }, (_, i) => count - i), [count]);

  const profileQuery = useQuery({
    queryKey: ["profile", address, count, ISUSU_ADDRESS],
    enabled: isConfigured && Boolean(address) && count > 0,
    queryFn: async (): Promise<ProfileEntry[]> => {
      const [views, members] = await Promise.all([
        publicClient.multicall({
          contracts: ids.map((id) => ({
            address: ISUSU_ADDRESS,
            abi: isusuAbi,
            functionName: "getCircle" as const,
            args: [BigInt(id)] as const,
          })),
          allowFailure: true,
        }),
        publicClient.multicall({
          contracts: ids.map((id) => ({
            address: ISUSU_ADDRESS,
            abi: isusuAbi,
            functionName: "getMember" as const,
            args: [BigInt(id), address!] as const,
          })),
          allowFailure: true,
        }),
      ]);

      return ids.flatMap((id, index) => {
        const viewResult = views[index];
        const memberResult = members[index];
        if (viewResult?.status !== "success" || memberResult?.status !== "success") return [];
        const member = normalizeMember(memberResult.result);
        if (member.slot === 0) return [];
        return [{ id, view: normalize(viewResult.result), member }];
      });
    },
  });

  const entries = profileQuery.data ?? [];
  const settled = (entry: (typeof entries)[number]) =>
    entry.view.finished || entry.view.cancelled;
  const stats = {
    circles: entries.length,
    completed: entries.filter((entry) => entry.view.finished && !entry.view.cancelled).length,
    defaults: entries.filter((entry) => entry.member.defaulted).length,
    received: entries.reduce((sum, entry) => sum + entry.member.received, 0n),
    paidIn: entries.reduce((sum, entry) => sum + entry.member.deposited, 0n),
    // Collateral is locked while a circle is running; only a finished or
    // cancelled circle leaves a credit the member can actually pull out. A
    // deferred payout is withdrawable immediately.
    refundable: entries.reduce(
      (sum, entry) =>
        sum + entry.member.owed + (settled(entry) ? entry.member.credit : 0n),
      0n,
    ),
  };

  return {
    entries,
    stats,
    isLoading: countQuery.isLoading || (count > 0 && profileQuery.isLoading),
    isError: countQuery.isError || profileQuery.isError,
  };
}
