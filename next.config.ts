import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores unrelated lockfiles above this repo.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
