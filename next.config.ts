import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
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
