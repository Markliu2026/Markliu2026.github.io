"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { RecoBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Scenario } from "@/lib/types";

export default function MyScenariosPage() {
  const router = useRouter();
  const [items, setItems] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    api
      .get<Scenario[]>("/api/scenarios/mine")
      .then(setItems)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">我的提报</h1>
          <Link href="/scenarios/new" className="bg-blue-600 text-white text-sm rounded px-3 py-1.5">
            + 新建提报
          </Link>
        </div>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        {loading ? (
          <p className="text-gray-400 text-sm">加载中...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-400 text-sm">还没有提报，点击右上角新建。</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-2">场景名称</th>
                  <th className="px-4 py-2">模块</th>
                  <th className="px-4 py-2">状态</th>
                  <th className="px-4 py-2">初筛分</th>
                  <th className="px-4 py-2">结论</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link href={`/scenarios/${s.id}`} className="text-blue-700 hover:underline">
                        {s.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{s.sap_modules.join("、") || "—"}</td>
                    <td className="px-4 py-2"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-2">{s.latest_weighted_score ?? "—"}</td>
                    <td className="px-4 py-2"><RecoBadge reco={s.latest_recommendation} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
