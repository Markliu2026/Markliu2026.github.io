"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "@/components/Chart";
import ParticleField from "@/components/ParticleField";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

const NEON = ["#3491FA", "#14C9C9", "#722ED1", "#F7BA1E", "#23E08A", "#F5566C", "#5AA0FF"];

function useCountUp(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const a = from.current;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(a + (target - a) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function Kpi({ label, value, unit, decimals = 0 }: { label: string; value: number; unit?: string; decimals?: number }) {
  const v = useCountUp(value);
  return (
    <div className="twin-card twin-glow" style={{ padding: "18px 20px", flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 13, color: "#7f95c4", marginBottom: 8 }}>{label}</div>
      <div className="twin-kpi-value">
        {v.toLocaleString("zh-CN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
        {unit && <span style={{ fontSize: 15, marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function TwinHome() {
  const router = useRouter();
  const [s, setS] = useState<DashboardStats | null>(null);
  const [clock, setClock] = useState("");
  const [series, setSeries] = useState<number[]>(() => Array.from({ length: 40 }, () => 40 + Math.random() * 20));

  useEffect(() => {
    const load = () => api.get<DashboardStats>("/api/stats/overview").then(setS).catch(() => {});
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleString("zh-CN")), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const base = 40 + (s?.total ?? 20);
    const t = setInterval(() => {
      setSeries((prev) => {
        const next = prev.slice(1);
        let nv = prev[prev.length - 1] + (Math.random() - 0.5) * 14;
        nv = Math.max(base * 0.4, Math.min(base * 1.6, nv));
        next.push(Math.round(nv));
        return next;
      });
    }, 1600);
    return () => clearInterval(t);
  }, [s]);

  const nodes = useMemo(() => {
    const bs = s?.by_status ?? {};
    const sum = (ks: string[]) => ks.reduce((a, k) => a + (bs[k] ?? 0), 0);
    return [
      { label: "提报", value: (s?.total ?? 0) - (bs.draft ?? 0) },
      { label: "初筛通过", value: sum(["recommend_deep", "deep_eval", "pending_review", "poc_suggest", "poc_running", "poc_success", "poc_failed", "productizing", "productized"]) },
      { label: "深度评估", value: sum(["deep_eval", "pending_review", "poc_suggest", "poc_running", "poc_success", "poc_failed", "productizing", "productized"]) },
      { label: "评审会", value: sum(["pending_review", "poc_suggest", "poc_running", "poc_success", "poc_failed", "productizing", "productized"]) },
      { label: "POC", value: sum(["poc_running", "poc_success", "poc_failed", "productizing", "productized"]) },
      { label: "产品化", value: bs.productized ?? 0 },
    ];
  }, [s]);

  const W = 1200;
  const xs = nodes.map((_, i) => 80 + (i * (W - 160)) / (nodes.length - 1));
  const Y = 92;

  const lineOption = useMemo(
    () => ({
      grid: { left: 36, right: 16, top: 20, bottom: 24 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", show: false, data: series.map((_, i) => i), boundaryGap: false },
      yAxis: { type: "value", axisLabel: { color: "#5f76a8" }, splitLine: { lineStyle: { color: "rgba(90,130,220,.12)" } } },
      series: [
        {
          type: "line", data: series, smooth: true, symbol: "none",
          lineStyle: { width: 2.5, color: "#36e0e0", shadowBlur: 14, shadowColor: "rgba(54,224,224,.7)" },
          areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(54,224,224,.4)" }, { offset: 1, color: "rgba(54,224,224,0)" }] } },
        },
      ],
    }),
    [series],
  );

  const donutOption = useMemo(() => {
    const entries = Object.entries(s?.by_module ?? {}).sort((a, b) => b[1] - a[1]);
    return {
      color: NEON,
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { orient: "vertical", right: 6, top: "center", textStyle: { color: "#9fb2e0" }, itemHeight: 8 },
      series: [
        {
          type: "pie", radius: ["48%", "74%"], center: ["40%", "52%"],
          itemStyle: { borderColor: "#0a1126", borderWidth: 2 },
          label: { color: "#9fb2e0", fontSize: 11, formatter: "{b}\n{d}%" },
          data: entries.map(([name, value]) => ({ name, value })),
        },
      ],
    };
  }, [s]);

  const barOption = useMemo(() => {
    const entries = Object.entries(s?.by_industry ?? {}).sort((a, b) => b[1] - a[1]);
    return {
      grid: { left: 36, right: 16, top: 20, bottom: 26 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: entries.map((e) => e[0]), axisLabel: { color: "#7f95c4", fontSize: 11 }, axisLine: { lineStyle: { color: "rgba(90,130,220,.25)" } } },
      yAxis: { type: "value", axisLabel: { color: "#5f76a8" }, splitLine: { lineStyle: { color: "rgba(90,130,220,.12)" } } },
      series: [
        {
          type: "bar", barWidth: "50%", data: entries.map((e) => e[1]),
          itemStyle: { borderRadius: [4, 4, 0, 0], color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#5aa0ff" }, { offset: 1, color: "#14c9c9" }] } },
          label: { show: true, position: "top", color: "#9fb2e0" },
        },
      ],
    };
  }, [s]);

  const card: React.CSSProperties = { padding: 16 };
  const cardTitle: React.CSSProperties = { fontSize: 14, color: "#aebfe6", marginBottom: 8, fontWeight: 600, letterSpacing: ".5px" };

  return (
    <div className="twin-root">
      <div className="twin-grid" />
      <ParticleField />
      <div className="twin-scan" />

      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "22px 28px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "1px", background: "linear-gradient(90deg,#7db8ff,#36e0e0)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              🌱 金种子 · 场景数字孪生
            </div>
            <div style={{ color: "#6f86bb", fontSize: 13, marginTop: 4 }}>
              SAP数智工程师场景提报与评审 · 全生命周期实时孪生
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#8fa6d6", fontSize: 13 }}>
              <span className="twin-live-dot" style={{ marginRight: 6 }} />
              实时 · {clock}
            </span>
            <button
              onClick={() => router.push("/scenarios")}
              style={{ cursor: "pointer", border: "1px solid rgba(90,160,255,.5)", background: "rgba(40,90,200,.25)", color: "#cfe0ff", borderRadius: 10, padding: "8px 18px", fontSize: 14 }}
            >
              进入系统 →
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 22 }}>
          <Kpi label="场景总数" value={s?.total ?? 0} />
          <Kpi label="P0 / P1 高潜" value={s?.p0p1 ?? 0} />
          <Kpi label="初筛通过率" value={(s?.screening_pass_rate ?? 0) * 100} unit="%" />
          <Kpi label="POC 成功率" value={(s?.poc_success_rate ?? 0) * 100} unit="%" />
          <Kpi label="已产品化" value={s?.productized ?? 0} />
          <Kpi label="年化收益" value={s?.total_annual_benefit ?? 0} unit="万" />
        </div>

        <div className="twin-card" style={{ marginTop: 18, padding: "10px 16px 4px" }}>
          <div style={cardTitle}>场景全生命周期 · 流动管线</div>
          <svg viewBox={`0 0 ${W} 170`} style={{ width: "100%", height: 200 }}>
            <defs>
              <linearGradient id="flowg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#3491FA" />
                <stop offset="1" stopColor="#14C9C9" />
              </linearGradient>
            </defs>
            {xs.slice(0, -1).map((x, i) => {
              const x2 = xs[i + 1];
              const path = `M ${x} ${Y} L ${x2} ${Y}`;
              return (
                <g key={i}>
                  <line x1={x} y1={Y} x2={x2} y2={Y} stroke="rgba(90,150,255,.18)" strokeWidth={6} />
                  <line x1={x} y1={Y} x2={x2} y2={Y} stroke="url(#flowg)" strokeWidth={2.5} className="twin-flow" />
                  <circle r={4} fill="#36e0e0">
                    <animateMotion dur="1.7s" repeatCount="indefinite" path={path} />
                  </circle>
                </g>
              );
            })}
            {nodes.map((n, i) => (
              <g key={n.label}>
                <circle cx={xs[i]} cy={Y} r={28} className="twin-node-ring" fill="none" stroke={NEON[i % NEON.length]} strokeWidth={2} opacity={0.7} />
                <circle cx={xs[i]} cy={Y} r={22} fill="rgba(12,22,48,.9)" stroke={NEON[i % NEON.length]} strokeWidth={1.5} />
                <text x={xs[i]} y={Y + 6} textAnchor="middle" fontSize={20} fontWeight={800} fill="#eaf2ff">
                  {n.value}
                </text>
                <text x={xs[i]} y={Y + 50} textAnchor="middle" fontSize={14} fill="#9fb2e0">
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr", gap: 14, marginTop: 16 }}>
          <div className="twin-card" style={card}>
            <div style={cardTitle}>实时活跃度</div>
            <Chart option={lineOption} height={240} />
          </div>
          <div className="twin-card" style={card}>
            <div style={cardTitle}>模块分布</div>
            <Chart option={donutOption} height={240} />
          </div>
          <div className="twin-card" style={card}>
            <div style={cardTitle}>行业分布</div>
            <Chart option={barOption} height={240} />
          </div>
        </div>

        <div style={{ textAlign: "center", color: "#56689a", fontSize: 12, marginTop: 28 }}>
          SAP数智工程师创新中心 · 让「发现下一个 APS」成为可运营、可度量、可复用的组织能力
        </div>
      </div>
    </div>
  );
}
