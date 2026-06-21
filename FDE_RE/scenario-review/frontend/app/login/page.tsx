"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  ["consultant", "提报人"],
  ["screener", "初筛人"],
  ["reviewer", "评委"],
  ["admin", "管理员"],
];

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuth((s) => s.setToken);
  const [username, setUsername] = useState("consultant");
  const [password, setPassword] = useState("Passw0rd!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await login(username, password);
      setToken(token);
      router.push("/scenarios");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-8 w-96">
        <h1 className="text-xl font-semibold text-blue-700 mb-1">金种子场景提报评审</h1>
        <p className="text-sm text-gray-400 mb-6">MVP一期 · 提报与初筛闭环</p>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <label className="block text-sm text-gray-600 mb-1">账号</label>
        <input
          className="w-full border rounded px-3 py-2 mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="block text-sm text-gray-600 mb-1">密码</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "登录中..." : "登录"}
        </button>

        <div className="mt-5 text-xs text-gray-400">
          <div className="mb-1">演示账号（密码均为 Passw0rd!）：</div>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map(([u, label]) => (
              <button
                key={u}
                type="button"
                onClick={() => setUsername(u)}
                className="border rounded px-2 py-0.5 hover:bg-gray-50"
              >
                {u} · {label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
