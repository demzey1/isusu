import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  // Dev assets and HMR are rejected for hosts that aren't listed, which stops
  // the client bundle from hydrating. Keep both local spellings working.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // The floating dev badge would otherwise sit in every screenshot.
  devIndicators: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "img.logo.dev" }],
  },
};

export default nextConfig;
