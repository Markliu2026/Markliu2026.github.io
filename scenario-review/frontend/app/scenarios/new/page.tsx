"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import type { Scenario } from "@/lib/types";

const MODULES = ["PP", "MM", "SD", "FICO", "QM", "PM/EAM", "EWM", "MDG"];
const INDUSTRIES = ["离散制造", "流程制造", "新能源", "消费品", "汽车", "装备制造"];
const AI_CAPS = ["预测", "优化", "生成", "审核", "异常识别", "RAG", "Agent"];

export default function NewScenarioPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    industry: [] as string[],
    sap_modules: [] as string[],
    ai_capabilities: [] as string[],
    customer_name: "",
    pain_point: "",
    human_process: "",
    frequency: "",
    volume: "",
    kpi_candidates: "" as string,
    data_basis: "",
    willingness_to_pay: "unknown",
    estimated_value: "",
  });

  function toggle(field: "industry" | "sap_modules" | "ai_capabilities", value: string) {
    setForm((f) => {
      const arr = f[field];
      return { ...f, [field]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });
  }

  async function save(submit: boolean) {
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        kpi_candidates: form.kpi_candidates.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
      };
      const sc = await api.post<Scenario>("/api/scenarios", payload);
      if (submit) {
        await api.post(`/api/scenarios/${sc.id}/submit`);
      }
      router.push(`/scenarios/${sc.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const chip = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-xs border cursor-pointer ${
      active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600"
    }`;

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold mb-1">新建提报</h1>
        <p className="text-sm text-gray-400 mb-5">轻量提报表 · 10 分钟内完成（§6.1）</p>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
          <Field label="场景名称 *">
            <input className="input" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="如：需求预测数智工程师" />
          </Field>

          <Field label="所属行业 *">
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((i) => (
                <span key={i} className={chip(form.industry.includes(i))} onClick={() => toggle("industry", i)}>{i}</span>
              ))}
            </div>
          </Field>

          <Field label="所属模块 *">
            <div className="flex flex-wrap gap-2">
              {MODULES.map((m) => (
                <span key={m} className={chip(form.sap_modules.includes(m))} onClick={() => toggle("sap_modules", m)}>{m}</span>
              ))}
            </div>
          </Field>

          <Field label="AI 能力类型">
            <div className="flex flex-wrap gap-2">
              {AI_CAPS.map((c) => (
                <span key={c} className={chip(form.ai_capabilities.includes(c))} onClick={() => toggle("ai_capabilities", c)}>{c}</span>
              ))}
            </div>
          </Field>

          <Field label="客户/项目（可脱敏）">
            <input className="input" value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          </Field>

          <Field label="业务痛点 *">
            <textarea className="input" rows={2} value={form.pain_point}
              onChange={(e) => setForm({ ...form, pain_point: e.target.value })} />
          </Field>

          <Field label="现状如何靠人解决 *">
            <textarea className="input" rows={2} value={form.human_process}
              onChange={(e) => setForm({ ...form, human_process: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="决策频率">
              <input className="input" placeholder="每日/每周/月度" value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
            </Field>
            <Field label="处理数量">
              <input className="input" value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })} />
            </Field>
          </div>

          <Field label="可量化业务KPI *（逗号分隔）">
            <input className="input" placeholder="OTD, 库存周转, 月结天数" value={form.kpi_candidates}
              onChange={(e) => setForm({ ...form, kpi_candidates: e.target.value })} />
          </Field>

          <Field label="数据基础 *">
            <textarea className="input" rows={2} placeholder="数据在SAP/外围系统/文档中是否可得"
              value={form.data_basis} onChange={(e) => setForm({ ...form, data_basis: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="客户付费意愿">
              <select className="input" value={form.willingness_to_pay}
                onChange={(e) => setForm({ ...form, willingness_to_pay: e.target.value })}>
                <option value="unknown">未知</option>
                <option value="strong">强</option>
                <option value="medium">中</option>
                <option value="weak">弱</option>
              </select>
            </Field>
            <Field label="预估价值">
              <input className="input" placeholder="降本/增效/增收量级" value={form.estimated_value}
                onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button disabled={saving} onClick={() => save(false)}
              className="border rounded px-4 py-2 text-sm disabled:opacity-50">保存草稿</button>
            <button disabled={saving} onClick={() => save(true)}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm disabled:opacity-50">提交</button>
          </div>
        </div>
      </main>

      <style>{`.input{width:100%;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;font-size:14px}`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
