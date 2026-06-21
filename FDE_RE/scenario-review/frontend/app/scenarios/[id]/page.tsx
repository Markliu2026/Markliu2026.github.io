"use client";

import {
  Button,
  Card,
  Descriptions,
  Divider,
  Input,
  Message,
  Space,
  Spin,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { IconSend } from "@arco-design/web-react/icon";
import { use, useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { RecoBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import type { Comment, ReviewScore, Scenario } from "@/lib/types";
import { VETO_FLAGS } from "@/lib/types";

const WTP: Record<string, string> = { strong: "强", medium: "中", weak: "弱", unknown: "未知" };

export default function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sc, setSc] = useState<Scenario | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [scores, setScores] = useState<ReviewScore[]>([]);
  const [newComment, setNewComment] = useState("");
  const [err, setErr] = useState("");

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
    reload().catch((e) => setErr((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submit() {
    try {
      await api.post(`/api/scenarios/${id}/submit`);
      await reload();
      Message.success("已提交，等待初筛");
    } catch (e) {
      Message.error((e as Error).message);
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
      <PageContainer maxWidth={860}>
        {err ? <Typography.Text type="error">{err}</Typography.Text> : <Spin />}
      </PageContainer>
    );
  }

  const data = [
    { label: "所属行业", value: sc.industry.join("、") || "—" },
    { label: "SAP 模块", value: sc.sap_modules.join("、") || "—" },
    { label: "AI 能力", value: sc.ai_capabilities.join("、") || "—" },
    { label: "客户/项目", value: sc.customer_name || "—" },
    { label: "决策频率", value: sc.frequency || "—" },
    { label: "处理数量", value: sc.volume || "—" },
    { label: "候选 KPI", value: sc.kpi_candidates.join("、") || "—" },
    { label: "付费意愿", value: WTP[sc.willingness_to_pay] ?? sc.willingness_to_pay },
    { label: "业务痛点", value: sc.pain_point || "—", span: 2 },
    { label: "人工现状", value: sc.human_process || "—", span: 2 },
    { label: "数据基础", value: sc.data_basis || "—", span: 2 },
  ];

  return (
    <PageContainer maxWidth={860}>
      <Space align="center" style={{ marginBottom: 4 }}>
        <Typography.Title heading={6} style={{ margin: 0 }}>
          {sc.title}
        </Typography.Title>
        <StatusBadge status={sc.status} />
        <RecoBadge reco={sc.latest_recommendation} />
      </Space>
      <div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          创建于 {new Date(sc.created_at).toLocaleString("zh-CN")}
        </Typography.Text>
      </div>

      {(sc.status === "draft" || sc.status === "need_info") && (
        <Button type="primary" style={{ marginTop: 14 }} onClick={submit}>
          提交初筛
        </Button>
      )}

      <Card bordered={false} style={{ borderRadius: 8, marginTop: 16 }}>
        <Descriptions
          column={2}
          colon=" :"
          labelStyle={{ color: "var(--color-text-3)", width: 90 }}
          data={data}
        />
      </Card>

      {scores.length > 0 && (
        <Card bordered={false} style={{ borderRadius: 8, marginTop: 16 }} title="初筛评分记录">
          {scores.map((s, i) => (
            <div key={s.id}>
              {i > 0 && <Divider style={{ margin: "12px 0" }} />}
              <Space>
                <RecoBadge reco={s.recommendation} />
                <Typography.Text style={{ fontWeight: 600 }}>加权分 {s.weighted_score}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  业务{s.business_value_score}/可行{s.feasibility_score}/复制{s.replicability_score}/战略
                  {s.strategic_fit_score}
                </Typography.Text>
              </Space>
              {s.veto_flags.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {s.veto_flags.map((f) => (
                    <Tag key={f} color="orange" size="small" style={{ marginRight: 4 }}>
                      {VETO_FLAGS[f] ?? f}
                    </Tag>
                  ))}
                </div>
              )}
              {s.comment && (
                <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: "6px 0 0" }}>
                  {s.comment}
                </Typography.Paragraph>
              )}
            </div>
          ))}
        </Card>
      )}

      <Card bordered={false} style={{ borderRadius: 8, marginTop: 16 }} title="评论与反馈">
        {comments.length === 0 && <Typography.Text type="secondary">暂无评论</Typography.Text>}
        {comments.map((c) => (
          <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-1)" }}>
            <Typography.Text>{c.content}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
              {new Date(c.created_at).toLocaleString("zh-CN")}
            </Typography.Text>
          </div>
        ))}
        <Space style={{ marginTop: 12, width: "100%" }}>
          <Input
            style={{ width: 600 }}
            value={newComment}
            onChange={setNewComment}
            placeholder="补充材料说明 / 反馈..."
            onPressEnter={addComment}
          />
          <Button type="primary" icon={<IconSend />} onClick={addComment}>
            发送
          </Button>
        </Space>
      </Card>
    </PageContainer>
  );
}
