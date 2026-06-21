"use client";

import Nav from "@/components/Nav";

export default function PageContainer({
  children,
  maxWidth = 1080,
}: {
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <>
      <Nav />
      <main style={{ maxWidth, margin: "0 auto", padding: "24px 24px 48px" }}>{children}</main>
    </>
  );
}
