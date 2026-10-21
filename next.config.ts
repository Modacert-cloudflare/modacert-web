import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
  experimental: {
    viewTransition: true,
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
