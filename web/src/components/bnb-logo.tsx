"use client";

import { useState } from "react";

import { LOGO_DEV_TOKEN } from "@/lib/config";

/** BNB Chain mark for the footer, with a local fallback. */
export function BnbLogo({ size = 14, className = "" }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (LOGO_DEV_TOKEN && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://img.logo.dev/bnbchain.org?token=${LOGO_DEV_TOKEN}&format=webp&retina=true`}
        alt="BNB Chain"
        width={size}
        height={size}
        className={`object-contain ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-label="BNB Chain"
      role="img"
      className={className}
    >
      <path d="M16 3 21 8 16 13 11 8Z" fill="var(--color-marigold)" />
      <path d="M8 11 13 16 8 21 3 16Z" fill="var(--color-marigold)" />
      <path d="M24 11 29 16 24 21 19 16Z" fill="var(--color-marigold)" />
      <path d="M16 19 21 24 16 29 11 24Z" fill="var(--color-marigold)" />
      <circle cx="16" cy="16" r="2.4" fill="var(--color-marigold)" />
    </svg>
  );
}
