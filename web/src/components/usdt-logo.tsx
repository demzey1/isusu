"use client";

import { useState } from "react";

import { LOGO_DEV_TOKEN } from "@/lib/config";

/**
 * Tether mark. Logo.dev when a token is configured, a hand-drawn local stamp
 * otherwise (or if the request fails), so the header never breaks.
 */
export function UsdtLogo({ size = 20, className = "" }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const showRemote = Boolean(LOGO_DEV_TOKEN) && !failed;

  if (showRemote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://img.logo.dev/tether.to?token=${LOGO_DEV_TOKEN}&size=${size * 2}&format=png`}
        alt="USDT"
        width={size}
        height={size}
        className={`rounded-full bg-cream ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-label="USDT"
      role="img"
      className={className}
    >
      <circle cx="16" cy="16" r="15" fill="var(--color-moss)" />
      <path
        d="M8.5 10.5h15M16 10.5v13M11.5 15.5h9M11.5 19h9"
        stroke="var(--color-cream)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
