"use client";

import { useState } from "react";

import { LOGO_DEV_TOKEN } from "@/lib/config";

/**
 * Tether mark. Logo.dev when a token is configured, a local stamp otherwise
 * (or if the request fails), so the page never breaks.
 */
export function UsdtLogo({ size = 20, className = "" }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (LOGO_DEV_TOKEN && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://img.logo.dev/tether.to?token=${LOGO_DEV_TOKEN}&format=webp&retina=true`}
        alt="USDT"
        width={size}
        height={size}
        className={`rounded-full bg-cream object-contain ${className}`}
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
      <circle cx="16" cy="16" r="15" fill="var(--color-marigold)" />
      <path
        d="M8.5 10.5h15M16 10.5v13M11.5 15.5h9M11.5 19h9"
        stroke="var(--color-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
