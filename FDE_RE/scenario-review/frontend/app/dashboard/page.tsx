"use client";

import { Card, Grid, Spin, Typography } from "@arco-design/web-react";
import { useEffect, useMemo, useState } from "react";
import PageContainer from "@/components/PageContainer";
import Chart, { ARCO_PALETTE } from "@/components/Chart";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const { Row, Col } = Grid;

function KpiCard({
  label,
  value,
  unit,
  bg,
}: {
  label: string;
  value: string | number;
  unit?: string;
  bg: string;
}) {
  return (
    <Card bordered={false} style={{ borderRadius: 12, background: bg }} bodyStyle={{ padding: 20 }}>
      <div style={{ color: "var(--color-text-3)", fontSize: 14, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#1D2129", lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4 }}>{unit}</span>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [s, setS] = useState<DashboardStats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get<DashboardStats>("/api/stats/dashboard")
      .then(setS)
      .catch((e) => setErr((e as Error).message));
  }, []);

  const barOption = useMemo(() => {
    const entries = Object.entries(s?.by_industry ?? {}).sort((a, b) => b[1] - a[1]);
    return {
      grid: { left: 40, right: 16, top: 30, bottom: 30 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: entries.map((e) => e[0]), axisLine: { lineStyle: { color: "#E5E6EB" } }, axisLabel: { color: "#4E5969" } },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed", color: "#F2F3F5" } }, axisLabel: { color: "#86909C" } },
      series: [
        {
          type: "bar",
          data: entries.map((e) => e[1]),
          barWidth: "46%",
          itemStyle: { color: "#165DFF", borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: "top", color: "#4E5969" },
        },
      ],
    };
  }, [s]);

  const donutOption = useMemo(() => {
    const entries = Object.entries(s?.by_module ?? {}).sort((a, b) => b[1] - a[1]);
    return {
      color: ARCO_PALETTE,
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { orient: "vertical", right: 8, top: "center", textStyle: { color: "#4E5969" } },
      series: [
        {
          type: "pie",
          radius: ["45%", "72%"],
          center: ["38%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#fff", borderWidth: 2 },
          label: { formatter: "{b}\n{d}%", color: "#4E5969", fontSize: 11 },
          data: entries.map(([name, value]) => ({ name, value })),
        },
      ],
    };
  }, [s]);

  const funnelOption = useMemo(() => {
    const bs = s?.by_status ?? {};
    const sum = (keys: string[]) => keys.reduce((acc, k) => acc + (bs[k] ?? 0), 0);
    const deepPlus = [
      "recommend_deep", "deep_eval", "pending_review", "poc_suggest",
      "poc_running", "poc_success", "poc_failed", "productizing", "productized",
    ];
    const pocPlus = ["poc_running", "poc_success", "poc_failed", "productizing", "productized"];
    const successPlus = ["poc_success", "productizing", "productized"];
    const stages = [
      { name: "提报", value: (s?.total ?? 0) - (bs.draft ?? 0) },
      { name: "推荐深评", value: sum(deepPlus) },
      { name: "POC立项", value: sum(pocPlus) },
      { name: "POC成功", value: sum(successPlus) },
      { name: "已产品化", value: bs.productized ?? 0 },
    ];
    return {
      color: ARCO_PALETTE,
      tooltip: { trigger: "item", formatter: "{b}: {c}" },
      series: [
        {
          type: "funnel",
          left: "10%",
          right: "10%",
          top: 10,
          bottom: 10,
          minSize: "20%",
          sort: "none",
          gap: 2,
          label: { show: true, position: "inside", color: "#fff", formatter: "{b} {c}" },
          itemStyle: { borderColor: "#fff", borderWidth: 1 },
          data: stages,
        },
      ],
    };
  }, [s]);

  const statusBarOption = useMemo(() => {
    const entries = Object.entries(s?.by_status ?? {}).sort((a, b) => b[1] - a[1]);
    return {
      grid: { left: 80, right: 24, top: 10, bottom: 20 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "value", splitLine: { lineStyle: { type: "dashed", color: "#F2F3F5" } }, axisLabel: { color: "#86909C" } },
      yAxis: {
        type: "category",
        data: entries.map((e) => STATUS_LABELS[e[0]] ?? e[0]).reverse(),
        axisLine: { lineStyle: { color: "#E5E6EB" } },
        axisLabel: { color: "#4E5969" },
      },
      series: [
        {
          type: "bar",
          data: entries.map((e) => e[1]).reverse(),
          barWidth: "55%",
          itemStyle: { color: "#14C9C9", borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: "right", color: "#4E5969" },
        },
      ],
    };
  }, [s]);

  if (err)
    return (
      <PageContainer>
        <Typography.Text type="error">{err}</Typography.Text>
      </PageContainer>
    );
  if (!s)
    return (
      <PageContainer>
        <Spin />
      </PageContainer>
    );

  return (
    <PageContainer>
      <Typography.Title heading={5} style={{ marginTop: 0 }}>
        管理驾驶舱
      </Typography.Title>
      <Typography.Text type="secondary">场景池全景 · 漏斗转化 · 价值与分布</Typography.Text>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={6}>
          <KpiCard label="场景总数" value={s.total} bg="#EFF3FF" />
        </Col>
        <Col span={6}>
          <KpiCard label="初筛通过率" value={Math.round(s.screening_pass_rate * 100)} unit="%" bg="#E8FFEA" />
        </Col>
        <Col span={6}>
          <KpiCard label="POC 成功率" value={Math.round(s.poc_success_rate * 100)} unit="%" bg="#F5E8FF" />
        </Col>
        <Col span={6}>
          <KpiCard label="年化收益合计" value={s.total_annual_benefit} unit="万" bg="#FFF7E8" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card bordered={false} style={{ borderRadius: 12 }} title="行业分布">
            <Chart option={barOption} height={300} />
          </Card>
        </Col>
        <Col span={10}>
          <Card bordered={false} style={{ borderRadius: 12 }} title="模块分布">
            <Chart option={donutOption} height={300} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card bordered={false} style={{ borderRadius: 12 }} title="场景漏斗转化">
            <Chart option={funnelOption} height={320} />
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false} style={{ borderRadius: 12 }} title="状态分布">
            <Chart option={statusBarOption} height={320} />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
