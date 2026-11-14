import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted in Docker: .next/standalone holds server.js and only the
  // node_modules the app needs (see deploy/Dockerfile).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
