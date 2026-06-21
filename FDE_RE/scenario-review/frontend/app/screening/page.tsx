"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { RecoBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import type { Scenario } from "@/lib/types";
import { VETO_FLAGS } from "@/lib/types";

const DIMS = [
  ["business_value_score", "业务价值", "40%"],
  ["feasibility_score", "技术可行性", "25%"],
  ["replicability_score", "可复制性", "20%"],
  ["strategic_fit_score", "战略契合", "15%"],
] as const;

const TRANSITIONS = [
  ["recommend_deep", "推荐深评"],
  ["observing", "入库观察"],
  ["need_info", "退回补充"],
  ["rejected", "淘汰"],
  ["merged", "合并"],
];

export default function ScreeningPage() {
  const [queue, setQueue] = useState<Scenario[]>([]);
  const [active, setActive] = useState<Scenario | null>(null);
  const [scores, setScores] = useState({
    business_value_score: 3,
    feasibility_score: 3,
    replicability_score: 3,
    strategic_fit_score: 3,
  });
  const [veto, setVeto] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");

  async function loadQueue() {
    setQueue(await api.get<Scenario[]>("/api/scenarios/screening-queue"));
  }
  useEffect(() => {
    loadQueue().catch((e) => setMsg((e as Error).message));
  }, []);

  // 前端预览加权分（与后端 §6.3.1 权重一致）
  const preview =
    scores.business_value_score * 0.4 +
    scores.feasibility_score * 0.25 +
    scores.replicability_score * 0.2 +
    scores.strategic_fit_score * 0.15;
  const previewLevel = veto.length
    ? "命中否决项 → 不可直通"
    : preview >= 4 ? "P0" : preview >= 3 ? "P1" : preview >= 2 ? "P2" : "淘汰";

  async function submitScore() {
    if (!active) return;
    setMsg("");
    try {
      await api.post(`/api/scenarios/${active.id}/scores`, { ...scores, veto_flags: veto, comment });
      setMsg(`已评分：加权分 ${preview.toFixed(2)}`);
      await loadQueue();
      setActive(await api.get<Scenario>(`/api/scenarios/${active.id}`));
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function doTransition(target: string) {
    if (!active) return;
    setMsg("");
    try {
      await api.post(`/api/scenarios/${active.id}/transition`, {
        target_status: target,
        comment,
      });
      setMsg(`已流转至：${target}`);
      setActive(null);
      await loadQueue();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  function pick(s: Scenario) {
    setActive(s);
    setMsg("");
    setVeto([]);
    setComment("");
  }

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-3 gap-5">
        {/* 队列 */}
        <div className="col-span-1">
          <h1 className="text-lg font-semibold mb-3">初筛队列</h1>
          {queue.length === 0 && <p className="text-gray-400 text-sm">队列为空。</p>}
          <div className="space-y-2">
            {queue.map((s) => (
              <button key={s.id} onClick={() => pick(s)}
                className={`w-full text-left bg-white rounded-lg shadow-sm p-3 hover:shadow ${
                  active?.id === s.id ? "ring-2 ring-blue-500" : ""
                }`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{s.title}</span>
                  <StatusBadge status={s.status} />
                </div>
                <div className="text-xs text-gray-400 mt-1">{s.sap_modules.join("、")}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 评分面板 */}
        <div className="col-span-2">
          {!active ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400 text-sm">
              从左侧选择一个场景进行四维评分
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h2 className="font-semibold mb-1">{active.title}</h2>
              <p className="text-sm text-gray-500 mb-4">{active.pain_point}</p>

              {msg && <div className="mb-3 text-sm text-blue-700 bg-blue-50 p-2 rounded">{msg}</div>}

              <div className="space-y-3 mb-4">
                {DIMS.map(([key, label, weight]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-gray-600">{label}</span>
                    <span className="text-xs text-gray-400 w-10">{weight}</span>
                    <input type="range" min={1} max={5} step={1}
                      value={scores[key]}
                      onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
                      className="flex-1" />
                    <span className="w-6 text-center font-medium">{scores[key]}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded flex items-center justify-between">
                <span className="text-sm text-gray-600">综合加权分（预览）</span>
                <span className="font-semibold">
                  {preview.toFixed(2)} · {previewLevel}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">否决项（命中则不可直通 POC，§6.3.3）</div>
                <div className="space-y-1">
                  {Object.entries(VETO_FLAGS).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" checked={veto.includes(k)}
                        onChange={(e) =>
                          setVeto((v) => (e.target.checked ? [...v, k] : v.filter((x) => x !== k)))
                        } />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <textarea className="w-full border rounded px-3 py-2 text-sm mb-4" rows={2}
                placeholder="评分理由 / 退回原因（必填留痕）" value={comment}
                onChange={(e) => setComment(e.target.value)} />

              <div className="flex flex-wrap gap-2">
                <button onClick={submitScore}
                  className="bg-blue-600 text-white text-sm rounded px-4 py-2">提交评分</button>
                <span className="w-px bg-gray-200 mx-1" />
                {TRANSITIONS.map(([t, label]) => (
                  <button key={t} onClick={() => doTransition(t)}
                    className="border text-sm rounded px-3 py-2 hover:bg-gray-50">{label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
