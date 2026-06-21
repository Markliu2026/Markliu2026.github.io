import type { Metadata } from "next";
import "@arco-design/web-react/dist/css/arco.css";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "场景提报与评审系统",
  description: "SAP数智工程师金种子场景提报与评审 — MVP一期",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
