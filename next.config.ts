import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow avatar uploads up to ~5MB (default is 1MB, which silently
      // breaks normal phone photos).
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
