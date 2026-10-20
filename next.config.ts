import type { NextConfig } from "next";
import path from "node:path";
import { certificateRewrites } from "./lib/certificate-rewrites";

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
  rewrites: async () => certificateRewrites(),
};

export default nextConfig;
