import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.15.14", "localhost:3000"],
  async rewrites() {
    return [
      {
        source: "/landing",
        destination: "/landing/index.html",
      },
      {
        source: "/institucional",
        destination: "/landing/index.html",
      },
    ];
  },
};

export default nextConfig;
