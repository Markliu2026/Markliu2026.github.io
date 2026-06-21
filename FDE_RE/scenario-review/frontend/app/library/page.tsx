"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { RecoBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import type { Scenario } from "@/lib/types";

export default function LibraryPage() {
  const [items, setItems] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Scenario[]>("/api/scenarios/library").then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold mb-1">场景库</h1>
        <p className="text-sm text-gray-400 mb-4">推荐深评 / 入库观察的公开场景（§9.1）</p>

        {loading ? (
          <p className="text-gray-400 text-sm">加载中...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无公开场景。</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((s) => (
              <Link key={s.id} href={`/scenarios/${s.id}`}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow transition">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-blue-700">{s.title}</span>
                  <RecoBadge reco={s.latest_recommendation} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={s.status} />
                  <span className="text-xs text-gray-400">{s.sap_modules.join("、")}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{s.pain_point}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
