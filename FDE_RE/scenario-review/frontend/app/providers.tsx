"use client";

import { ConfigProvider } from "@arco-design/web-react";
import zhCN from "@arco-design/web-react/es/locale/zh-CN";

// 抑制 Arco 2.66（当前最新稳定版）在 React 19 下访问 element.ref 触发的弃用告警。
// 仅为开发期噪声，不影响功能；生产构建本就不会出现。Arco 修复后可移除。
// 用 symbol 守卫，避免 HMR 重复包裹。
const SUPPRESS = [
  "Accessing element.ref was removed in React 19",
  "Accessing element.ref is no longer supported",
];
declare global {
  interface Console {
    __arcoRefPatched?: boolean;
  }
}
if (typeof window !== "undefined" && !console.__arcoRefPatched) {
  const orig = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const first = typeof args[0] === "string" ? args[0] : "";
    if (SUPPRESS.some((s) => first.includes(s))) return;
    orig(...args);
  };
  console.__arcoRefPatched = true;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ConfigProvider locale={zhCN}>{children}</ConfigProvider>;
}
