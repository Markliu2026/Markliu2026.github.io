"use client";

import {
  Button,
  Card,
  Checkbox,
  Empty,
  Grid,
  Input,
  Message,
  Slider,
  Space,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import type { Scenario } from "@/lib/types";
import { VETO_FLAGS } from "@/lib/types";

const { Row, Col } = Grid;

const DIMS = [
  ["business_value_score", "业务价值", "40%"],
  ["feasibility_score", "技术可行性", "25%"],
  ["replicability_score", "可复制性", "20%"],
  ["strategic_fit_score", "战略契合", "15%"],
] as const;

const TRANSITIONS: [string, string, "primary" | "default" | "outline"][] = [
  ["recommend_deep", "推荐深评", "primary"],
  ["observing", "入库观察", "outline"],
  ["need_info", "退回补充", "outline"],
  ["rejected", "淘汰", "default"],
  ["merged", "合并", "default"],
];

type ScoreKey = (typeof DIMS)[number][0];

export default function ScreeningPage() {
  const [queue, setQueue] = useState<Scenario[]>([]);
  const [active, setActive] = useState<Scenario | null>(null);
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    business_value_score: 3,
    feasibility_score: 3,
    replicability_score: 3,
    strategic_fit_score: 3,
  });
  const [veto, setVeto] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  async function loadQueue() {
    setQueue(await api.get<Scenario[]>("/api/scenarios/screening-queue"));
  }
  useEffect(() => {
    loadQueue().catch((e) => Message.error((e as Error).message));
  }, []);

  const preview =
    scores.business_value_score * 0.4 +
    scores.feasibility_score * 0.25 +
    scores.replicability_score * 0.2 +
    scores.strategic_fit_score * 0.15;
  const level = veto.length
    ? "命中否决项 → 不可直通"
    : preview >= 4 ? "P0" : preview >= 3 ? "P1" : preview >= 2 ? "P2" : "淘汰";
  const levelColor = veto.length
    ? "rgb(var(--orange-6))"
    : preview >= 4 ? "rgb(var(--green-6))" : preview >= 3 ? "rgb(var(--green-5))"
    : preview >= 2 ? "var(--color-text-3)" : "rgb(var(--red-6))";

  async function submitScore() {
    if (!active) return;
    try {
      await api.post(`/api/scenarios/${active.id}/scores`, { ...scores, veto_flags: veto, comment });
      Message.success(`已评分：加权分 ${preview.toFixed(2)} → ${level}`);
      await loadQueue();
      setActive(await api.get<Scenario>(`/api/scenarios/${active.id}`));
    } catch (e) {
      Message.error((e as Error).message);
    }
  }

  async function doTransition(target: string, label: string) {
    if (!active) return;
    try {
      await api.post(`/api/scenarios/${active.id}/transition`, { target_status: target, comment });
      Message.success(`已流转至：${label}`);
      setActive(null);
      await loadQueue();
    } catch (e) {
      Message.error((e as Error).message);
    }
  }

  function pick(s: Scenario) {
    setActive(s);
    setScores({
      business_value_score: 3,
      feasibility_score: 3,
      replicability_score: 3,
      strategic_fit_score: 3,
    });
    setVeto([]);
    setComment("");
  }

  return (
    <PageContainer>
      <Row gutter={20}>
        <Col span={8}>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            初筛队列
          </Typography.Title>
          {queue.length === 0 ? (
            <Empty description="队列为空" />
          ) : (
            <Space direction="vertical" style={{ width: "100%" }}>
              {queue.map((s) => (
                <Card
                  key={s.id}
                  hoverable
                  bodyStyle={{ padding: 12 }}
                  style={{
                    borderRadius: 8,
                    cursor: "pointer",
                    borderColor: active?.id === s.id ? "rgb(var(--primary-6))" : undefined,
                    boxShadow: active?.id === s.id ? "0 0 0 1px rgb(var(--primary-6))" : undefined,
                  }}
                  onClick={() => pick(s)}
                >
                  <Space>
                    <Typography.Text style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</Typography.Text>
                    <StatusBadge status={s.status} />
                  </Space>
                  <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 4 }}>
                    {s.sap_modules.join("、")}
                  </div>
                </Card>
              ))}
            </Space>
          )}
        </Col>

        <Col span={16}>
          {!active ? (
            <Card bordered={false} style={{ borderRadius: 8 }}>
              <Empty description="从左侧选择一个场景进行四维评分" />
            </Card>
          ) : (
            <Card bordered={false} style={{ borderRadius: 8 }}>
              <Typography.Title heading={6} style={{ marginTop: 0 }}>
                {active.title}
              </Typography.Title>
              <Typography.Paragraph type="secondary">{active.pain_point}</Typography.Paragraph>

              <div style={{ margin: "16px 0" }}>
                {DIMS.map(([key, label, weight]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ width: 90, fontSize: 13, color: "var(--color-text-2)" }}>{label}</span>
                    <Tag size="small">{weight}</Tag>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={scores[key]}
                      onChange={(v) => setScores((s) => ({ ...s, [key]: v as number }))}
                      style={{ flex: 1 }}
                      marks={{ 1: "1", 3: "3", 5: "5" }}
                    />
                    <span style={{ width: 24, textAlign: "center", fontWeight: 600 }}>{scores[key]}</span>
                  </div>
                ))}
              </div>

              <Card
                style={{ background: "var(--color-fill-1)", borderRadius: 8, marginBottom: 16 }}
                bodyStyle={{ padding: "12px 16px" }}
                bordered={false}
              >
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Typography.Text type="secondary">综合加权分（预览）</Typography.Text>
                  <Space align="center">
                    <span style={{ fontSize: 22, fontWeight: 700 }}>{preview.toFixed(2)}</span>
                    <Tag style={{ color: levelColor, fontWeight: 600 }} bordered>
                      {level}
                    </Tag>
                  </Space>
                </Space>
              </Card>

              <Typography.Text style={{ fontSize: 13, color: "var(--color-text-2)" }}>
                否决项（命中则不可直通 POC，§6.3.3）
              </Typography.Text>
              <div style={{ margin: "8px 0 16px" }}>
                <Checkbox.Group value={veto} onChange={setVeto} direction="vertical">
                  {Object.entries(VETO_FLAGS).map(([k, label]) => (
                    <Checkbox key={k} value={k}>
                      {label}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>

              <Input.TextArea
                placeholder="评分理由 / 退回原因（留痕）"
                value={comment}
                onChange={setComment}
                autoSize={{ minRows: 2 }}
                style={{ marginBottom: 16 }}
              />

              <Space wrap>
                <Button type="primary" onClick={submitScore}>
                  提交评分
                </Button>
                <span style={{ width: 1, height: 20, background: "var(--color-border-2)", margin: "0 4px" }} />
                {TRANSITIONS.map(([t, label, kind]) => (
                  <Button
                    key={t}
                    type={kind}
                    status={t === "rejected" ? "danger" : undefined}
                    onClick={() => doTransition(t, label)}
                  >
                    {label}
                  </Button>
                ))}
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </PageContainer>
  );
}
