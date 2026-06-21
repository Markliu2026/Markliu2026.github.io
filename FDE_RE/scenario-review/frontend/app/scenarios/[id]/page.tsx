"use client";

import { use, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { RecoBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import type { Comment, Scenario, ReviewScore } from "@/lib/types";
import { VETO_FLAGS } from "@/lib/types";

export default function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sc, setSc] = useState<Scenario | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [scores, setScores] = useState<ReviewScore[]>([]);
  const [newComment, setNewComment] = useState("");
  const [msg, setMsg] = useState("");

  async function reload() {
    setSc(await api.get<Scenario>(`/api/scenarios/${id}`));
    setComments(await api.get<Comment[]>(`/api/scenarios/${id}/comments`));
    try {
      setScores(await api.get<ReviewScore[]>(`/api/scenarios/${id}/scores`));
    } catch {
      setScores([]); // 普通顾问无权看评分明细
    }
  }

  useEffect(() => {
    reload().catch((e) => setMsg((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submit() {
    setMsg("");
    try {
      await api.post(`/api/scenarios/${id}/submit`);
      await reload();
      setMsg("已提交，等待初筛。");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function addComment() {
    if (!newComment.trim()) return;
    await api.post(`/api/scenarios/${id}/comments`, { content: newComment });
    setNewComment("");
    setComments(await api.get<Comment[]>(`/api/scenarios/${id}/comments`));
  }

  if (!sc) {
    return (
      <>
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-6 text-sm text-gray-400">
          {msg || "加载中..."}
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-lg font-semibold">{sc.title}</h1>
          <StatusBadge status={sc.status} />
          <RecoBadge reco={sc.latest_recommendation} />
        </div>
        <p className="text-xs text-gray-400 mb-4">
          创建于 {new Date(sc.created_at).toLocaleString("zh-CN")}
        </p>

        {msg && <div className="mb-4 text-sm text-blue-700 bg-blue-50 p-2 rounded">{msg}</div>}

        {(sc.status === "draft" || sc.status === "need_info") && (
          <button onClick={submit} className="mb-4 bg-blue-600 text-white text-sm rounded px-4 py-2">
            提交初筛
          </button>
        )}

        <section className="bg-white rounded-lg shadow-sm p-5 mb-5 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Info label="所属行业" value={sc.industry.join("、")} />
          <Info label="SAP 模块" value={sc.sap_modules.join("、")} />
          <Info label="AI 能力" value={sc.ai_capabilities.join("、")} />
          <Info label="客户/项目" value={sc.customer_name} />
          <Info label="决策频率" value={sc.frequency} />
          <Info label="处理数量" value={sc.volume} />
          <Info label="候选KPI" value={sc.kpi_candidates.join("、")} />
          <Info label="付费意愿" value={sc.willingness_to_pay} />
          <Info label="业务痛点" value={sc.pain_point} full />
          <Info label="人工现状" value={sc.human_process} full />
          <Info label="数据基础" value={sc.data_basis} full />
        </section>

        {scores.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm p-5 mb-5">
            <h2 className="text-sm font-semibold mb-3">初筛评分记录</h2>
            {scores.map((s) => (
              <div key={s.id} className="border-t py-2 text-sm first:border-t-0">
                <div className="flex items-center gap-3">
                  <RecoBadge reco={s.recommendation} />
                  <span className="font-medium">加权分 {s.weighted_score}</span>
                  <span className="text-gray-400 text-xs">
                    业务{s.business_value_score}/可行{s.feasibility_score}/复制
                    {s.replicability_score}/战略{s.strategic_fit_score}
                  </span>
                </div>
                {s.veto_flags.length > 0 && (
                  <div className="text-xs text-amber-700 mt-1">
                    否决项：{s.veto_flags.map((f) => VETO_FLAGS[f] ?? f).join("；")}
                  </div>
                )}
                {s.comment && <div className="text-gray-500 text-xs mt-1">{s.comment}</div>}
              </div>
            ))}
          </section>
        )}

        <section className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-semibold mb-3">评论与反馈</h2>
          <div className="space-y-2 mb-3">
            {comments.length === 0 && <p className="text-xs text-gray-300">暂无评论</p>}
            {comments.map((c) => (
              <div key={c.id} className="text-sm border-b pb-2">
                <span className="text-gray-700">{c.content}</span>
                <span className="text-xs text-gray-300 ml-2">
                  {new Date(c.created_at).toLocaleString("zh-CN")}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="补充材料说明 / 反馈..."
            />
            <button onClick={addComment} className="bg-gray-700 text-white text-sm rounded px-4">
              发送
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

function Info({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-gray-800 whitespace-pre-wrap">{value || "—"}</div>
    </div>
  );
}
