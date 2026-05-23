import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server's HMR resources to be requested from 127.0.0.1
  // (used by the Playwright e2e webServer).
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
