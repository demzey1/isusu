export const USDT_DECIMALS = 18;

export function formatUsdt(value: bigint | undefined, maxDigits = 2): string {
  if (value === undefined) return "-";
  const whole = value / 10n ** BigInt(USDT_DECIMALS);
  const frac = value % 10n ** BigInt(USDT_DECIMALS);
  const fracStr = frac.toString().padStart(USDT_DECIMALS, "0").slice(0, maxDigits);
  const wholeStr = new Intl.NumberFormat("en-US").format(whole);
  return maxDigits > 0 ? `${wholeStr}.${fracStr}` : wholeStr;
}

export function usdtParts(value: bigint | undefined): { whole: string; frac: string } {
  if (value === undefined) return { whole: "-", frac: "" };
  const whole = value / 10n ** BigInt(USDT_DECIMALS);
  const frac = value % 10n ** BigInt(USDT_DECIMALS);
  const wholeStr = new Intl.NumberFormat("en-US").format(whole);
  const fracStr = frac
    .toString()
    .padStart(USDT_DECIMALS, "0")
    .slice(0, 2)
    .replace(/0+$/, "");
  return { whole: wholeStr, frac: fracStr };
}

export function parseUsdt(input: string): bigint | null {
  const clean = input.trim().replace(/,/g, "");
  if (!/^\d*(\.\d*)?$/.test(clean) || clean === "" || clean === ".") return null;
  const [whole, frac = ""] = clean.split(".");
  if (frac.length > USDT_DECIMALS) return null;
  try {
    return BigInt(whole || "0") * 10n ** BigInt(USDT_DECIMALS) + BigInt(frac.padEnd(USDT_DECIMALS, "0") || "0");
  } catch {
    return null;
  }
}

export function shortAddress(address?: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatDate(unixSeconds: number | bigint): string {
  const ms = Number(unixSeconds) * 1000;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function formatDay(unixSeconds: number | bigint): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(Number(unixSeconds) * 1000),
  );
}

export function formatDuration(seconds: number): string {
  if (seconds >= 86400) {
    const d = Math.round(seconds / 86400);
    return `${d} ${d === 1 ? "day" : "days"}`;
  }
  if (seconds >= 3600) {
    const h = Math.round(seconds / 3600);
    return `${h} ${h === 1 ? "hour" : "hours"}`;
  }
  const m = Math.max(1, Math.round(seconds / 60));
  return `${m} min`;
}

export function countdown(target: number, now: number) {
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return { diff, days, hours, minutes, seconds, done: diff === 0 };
}

export function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function shortCountdown(target: number, now: number): string {
  const { days, hours, minutes, seconds, done } = countdown(target, now);
  if (done) return "now";
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}
