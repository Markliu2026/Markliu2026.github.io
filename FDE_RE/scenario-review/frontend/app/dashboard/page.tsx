"use client";

import { Card, Grid, Progress, Spin, Statistic, Typography } from "@arco-design/web-react";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const { Row, Col } = Grid;

function Dist({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  return (
    <Card bordered={false} style={{ borderRadius: 8, height: "100%" }} title={title}>
      {entries.length === 0 && <Typography.Text type="secondary">暂无数据</Typography.Text>}
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 90, fontSize: 12, color: "var(--color-text-2)" }}>
            {STATUS_LABELS[k] ?? k}
          </span>
          <Progress percent={Math.round((v / max) * 100)} showText={false} style={{ flex: 1 }} />
          <span style={{ width: 28, textAlign: "right", fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </Card>
  );
}

export default function DashboardPage() {
  const [s, setS] = useState<DashboardStats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get<DashboardStats>("/api/stats/dashboard").then(setS).catch((e) => setErr((e as Error).message));
  }, []);

  if (err) return <PageContainer><Typography.Text type="error">{err}</Typography.Text></PageContainer>;
  if (!s) return <PageContainer><Spin /></PageContainer>;

  const cards: [string, number | string, string?][] = [
    ["场景总数", s.total],
    ["P0/P1 数", s.p0p1],
    ["初筛通过率", `${Math.round(s.screening_pass_rate * 100)}%`],
    ["POC 数", s.poc_count],
    ["POC 成功率", `${Math.round(s.poc_success_rate * 100)}%`],
    ["已产品化", s.productized],
    ["年化收益合计", `${s.total_annual_benefit} 万`],
    ["平均 ROI 倍数", s.avg_roi_multiple ?? "—"],
  ];

  return (
    <PageContainer>
      <Typography.Title heading={6} style={{ marginTop: 0 }}>
        管理驾驶舱
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {cards.map(([label, value]) => (
          <Col span={6} key={label}>
            <Card bordered={false} style={{ borderRadius: 8 }}>
              <Statistic title={label} value={value as number} groupSeparator />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}><Dist title="状态分布" data={s.by_status} /></Col>
        <Col span={8}><Dist title="行业分布" data={s.by_industry} /></Col>
        <Col span={8}><Dist title="模块分布" data={s.by_module} /></Col>
      </Row>
    </PageContainer>
  );
}
