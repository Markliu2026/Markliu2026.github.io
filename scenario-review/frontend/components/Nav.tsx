"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export default function Nav() {
  const { user, token, setUser, logout, hydrate } = useAuth();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (token && !user) {
      api.get<User>("/api/auth/me").then(setUser).catch(() => logout());
    }
  }, [token, user, setUser, logout]);

  const isScreener =
    user?.roles.includes("screener") || user?.roles.includes("admin");

  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <span className="font-semibold text-blue-700">金种子 · 场景提报评审</span>
        <nav className="flex gap-4 text-sm text-gray-600">
          <Link href="/scenarios" className="hover:text-blue-700">我的提报</Link>
          <Link href="/scenarios/new" className="hover:text-blue-700">新建提报</Link>
          <Link href="/library" className="hover:text-blue-700">场景库</Link>
          {isScreener && (
            <Link href="/screening" className="hover:text-blue-700 font-medium text-blue-600">
              初筛队列
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user && (
            <span className="text-gray-500">
              {user.display_name}（{user.roles.join("/")}）
            </span>
          )}
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="text-gray-400 hover:text-red-600"
          >
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
