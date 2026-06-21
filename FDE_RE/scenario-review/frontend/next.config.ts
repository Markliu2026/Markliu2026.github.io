import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 代理后端 API，避免开发期跨域
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://localhost:8099";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
