import { decodeFunctionData, type Hex } from "viem";
import { describe, expect, it } from "vitest";

import { isusuAbi, usdtAbi } from "./abi";
import {
  approveCalldata,
  buildContributeSteps,
  buildJoinSteps,
  cancelCircleCalldata,
  closeRoundCalldata,
  contributeCalldata,
  createCircleCalldata,
  executeCommand,
  joinCalldata,
  previewCommand,
  withdrawCalldata,
} from "./calldata";
import { ISUSU_ADDRESS, USDT_ADDRESS } from "./config";

const SPENDER = "0x1111111111111111111111111111111111111111";
const WALLET = "0x2222222222222222222222222222222222222222" as const;

describe("ABI calldata", () => {
  it("encodes USDT approve with the exact spender and amount", () => {
    const data = approveCalldata(SPENDER, 7n * 10n ** 18n);

    const decoded = decodeFunctionData({ abi: usdtAbi, data });
    expect(decoded.functionName).toBe("approve");
    expect(decoded.args).toEqual([SPENDER, 7n * 10n ** 18n]);
  });

  it("encodes join with the circle id and seat", () => {
    const data = joinCalldata(6n, 3);

    const decoded = decodeFunctionData({ abi: isusuAbi, data });
    expect(decoded.functionName).toBe("join");
    expect(decoded.args).toEqual([6n, 3]);
  });

  it("encodes contribute with the circle id", () => {
    const data = contributeCalldata(6n);

    const decoded = decodeFunctionData({ abi: isusuAbi, data });
    expect(decoded.functionName).toBe("contribute");
    expect(decoded.args).toEqual([6n]);
  });

  it("encodes createCircle with contribution and periods in seconds", () => {
    const data = createCircleCalldata(2n * 10n ** 18n, 86400n, 604800n);

    const decoded = decodeFunctionData({ abi: isusuAbi, data });
    expect(decoded.functionName).toBe("createCircle");
    expect(decoded.args).toEqual([2n * 10n ** 18n, 86400n, 604800n]);
  });

  it("encodes withdraw with the circle id", () => {
    const data = withdrawCalldata(6n);

    const decoded = decodeFunctionData({ abi: isusuAbi, data });
    expect(decoded.functionName).toBe("withdraw");
    expect(decoded.args).toEqual([6n]);
  });

  it("encodes cancelCircle with the circle id", () => {
    const data = cancelCircleCalldata(6n);

    const decoded = decodeFunctionData({ abi: isusuAbi, data });
    expect(decoded.functionName).toBe("cancelCircle");
    expect(decoded.args).toEqual([6n]);
  });

  it("encodes closeRound with the circle id", () => {
    const data = closeRoundCalldata(6n);

    const decoded = decodeFunctionData({ abi: isusuAbi, data });
    expect(decoded.functionName).toBe("closeRound");
    expect(decoded.args).toEqual([6n]);
  });
});

describe("action steps", () => {
  it("joins with an exact approval of contribution plus collateral", () => {
    const contribution = 2n * 10n ** 18n;
    const amount = contribution + 6n * 10n ** 18n;

    const steps = buildJoinSteps({ id: 6, slot: 2, amount, allowance: 0n });
    expect(steps).toHaveLength(2);

    const approval = decodeFunctionData({ abi: usdtAbi, data: steps[0].inputData });
    expect(approval.functionName).toBe("approve");
    expect(approval.args).toEqual([ISUSU_ADDRESS, amount]);
    expect(steps[0].to).toBe(USDT_ADDRESS);

    const join = decodeFunctionData({ abi: isusuAbi, data: steps[1].inputData });
    expect(join.functionName).toBe("join");
    expect(join.args).toEqual([6n, 2]);
    expect(steps[1].to).toBe(ISUSU_ADDRESS);
  });

  it("skips the join approval when allowance already covers the seat", () => {
    const amount = 8n * 10n ** 18n;
    const steps = buildJoinSteps({ id: 6, slot: 2, amount, allowance: amount });

    expect(steps).toHaveLength(1);
    const join = decodeFunctionData({ abi: isusuAbi, data: steps[0].inputData });
    expect(join.functionName).toBe("join");
    expect(join.args).toEqual([6n, 2]);
  });

  it("contributes with an exact approval of one contribution", () => {
    const amount = 1n * 10n ** 18n;
    const steps = buildContributeSteps({ id: 6, amount, allowance: 0n });
    expect(steps).toHaveLength(2);

    const approval = decodeFunctionData({ abi: usdtAbi, data: steps[0].inputData });
    expect(approval.functionName).toBe("approve");
    expect(approval.args).toEqual([ISUSU_ADDRESS, amount]);

    const contribute = decodeFunctionData({ abi: isusuAbi, data: steps[1].inputData });
    expect(contribute.functionName).toBe("contribute");
    expect(contribute.args).toEqual([6n]);
  });

  it("skips the contribute approval when allowance already covers the round", () => {
    const amount = 1n * 10n ** 18n;
    const steps = buildContributeSteps({ id: 6, amount, allowance: amount });

    expect(steps).toHaveLength(1);
    const contribute = decodeFunctionData({ abi: isusuAbi, data: steps[0].inputData });
    expect(contribute.functionName).toBe("contribute");
    expect(contribute.args).toEqual([6n]);
  });
});

describe("CLI commands", () => {
  it("uses the wallet address as --from and keeps --value at zero", () => {
    const data = "0x1234abcd" as Hex;
    const command = previewCommand({
      wallet: WALLET,
      to: ISUSU_ADDRESS,
      inputData: data,
    });

    expect(command).toBe(
      `baw contract-call preview --binanceChainId 56 --from ${WALLET} --to ${ISUSU_ADDRESS} --value 0 --inputData ${data} --json`,
    );
    expect(executeCommand()).toBe("baw contract-call execute --requestId <requestId> --json");
  });
});
