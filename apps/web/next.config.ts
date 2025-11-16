import type { NextConfig } from "next";

export default {
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
} satisfies NextConfig;
