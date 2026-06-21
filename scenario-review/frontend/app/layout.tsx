import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "场景提报与评审系统",
  description: "SAP数智工程师金种子场景提报与评审 — MVP一期",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
