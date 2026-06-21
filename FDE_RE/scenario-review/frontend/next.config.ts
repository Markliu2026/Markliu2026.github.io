import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 容器化部署：输出独立 server.js（不依赖完整 node_modules）
  output: "standalone",
  // 固定追踪根为本项目目录，避免被父级仓库/lockfile 影响导致 standalone 产物嵌套
  outputFileTracingRoot: process.cwd(),
  // 代理后端 API（运行期读取 BACKEND_URL，服务端转发，浏览器无需跨域）
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://localhost:8099";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
