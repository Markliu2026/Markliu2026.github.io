"use client";

import {
  Button,
  Card,
  Descriptions,
  Divider,
  Input,
  Link as ArcoLink,
  Message,
  Space,
  Spin,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { IconLink, IconSend } from "@arco-design/web-react/icon";
import { use, useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { RecoBadge, StatusBadge } from "@/components/Badges";
import DeepEvalSection from "@/components/DeepEvalSection";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Attachment, Comment, ReviewScore, Scenario } from "@/lib/types";
import { CONFIDENTIALITY_LABELS, VETO_FLAGS, WTP_LABELS } from "@/lib/types";

export default function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const roles = useAuth((s) => s.user?.roles) ?? [];
  const isMgr = roles.includes("manager") || roles.includes("admin");
  const [sc, setSc] = useState<Scenario | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [scores, setScores] = useState<ReviewScore[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [attName, setAttName] = useState("");
  const [attUrl, setAttUrl] = useState("");
  const [err, setErr] = useState("");

  async function reload() {
    setSc(await api.get<Scenario>(`/api/scenarios/${id}`));
    setComments(await api.get<Comment[]>(`/api/scenarios/${id}/comments`));
    setAttachments(await api.get<Attachment[]>(`/api/scenarios/${id}/attachments`));
    try {
      setScores(await api.get<ReviewScore[]>(`/api/scenarios/${id}/scores`));
    } catch {
      setScores([]); // 普通顾问无权看评分明细
    }
  }

  async function addAttachment() {
    if (!attName.trim() || !attUrl.trim()) {
      Message.warning("请填写附件名称与链接（样本数据仅登记链接，不入库）");
      return;
    }
    await api.post(`/api/scenarios/${id}/attachments`, { filename: attName, file_url: attUrl });
    setAttName("");
    setAttUrl("");
    setAttachments(await api.get<Attachment[]>(`/api/scenarios/${id}/attachments`));
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

  async function act(target: string, label: string) {
    try {
      await api.post(`/api/scenarios/${id}/transition`, { target_status: target });
      await reload();
      Message.success(`已${label}`);
    } catch (e) {
      Message.error((e as Error).message);
    }
  }

  async function kickoff() {
    try {
      await api.post(`/api/poc/from-scenario/${id}`);
      await reload();
      Message.success("POC 已立项");
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
    { label: "付费意愿", value: WTP_LABELS[sc.willingness_to_pay] ?? sc.willingness_to_pay },
    { label: "预估价值", value: sc.estimated_value || "—" },
    {
      label: "保密级别",
      value: (
        <Tag size="small" color={sc.confidentiality_level === "public" ? "green" : "gray"}>
          {CONFIDENTIALITY_LABELS[sc.confidentiality_level] ?? sc.confidentiality_level}
        </Tag>
      ),
    },
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
      {isMgr && sc.status === "poc_suggest" && (
        <Button type="primary" style={{ marginTop: 14 }} onClick={kickoff}>
          POC 立项
        </Button>
      )}
      {isMgr && sc.status === "poc_success" && (
        <Button type="primary" style={{ marginTop: 14 }} onClick={() => act("productizing", "进入产品化")}>
          进入产品化
        </Button>
      )}
      {isMgr && sc.status === "productizing" && (
        <Button type="primary" style={{ marginTop: 14 }} onClick={() => act("productized", "标记已产品化")}>
          标记已产品化
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

      <DeepEvalSection scenario={sc} onChange={reload} />

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

      <Card
        bordered={false}
        style={{ borderRadius: 8, marginTop: 16 }}
        title={
          <Space>
            附件
            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              （样本数据不入库，仅登记链接 · §11.2）
            </Typography.Text>
          </Space>
        }
      >
        {attachments.length === 0 && <Typography.Text type="secondary">暂无附件</Typography.Text>}
        {attachments.map((a) => (
          <div key={a.id} style={{ padding: "6px 0" }}>
            <IconLink style={{ marginRight: 6, color: "rgb(var(--primary-6))" }} />
            <ArcoLink href={a.file_url} target="_blank">
              {a.filename}
            </ArcoLink>
            <Tag size="small" style={{ marginLeft: 8 }}>
              {CONFIDENTIALITY_LABELS[a.confidentiality_level] ?? a.confidentiality_level}
            </Tag>
          </div>
        ))}
        <Space style={{ marginTop: 12, width: "100%" }}>
          <Input
            style={{ width: 220 }}
            placeholder="附件名称（如：流程图）"
            value={attName}
            onChange={setAttName}
          />
          <Input
            style={{ width: 360 }}
            placeholder="链接 URL（流程图/截图/样例报表/纪要）"
            value={attUrl}
            onChange={setAttUrl}
          />
          <Button icon={<IconLink />} onClick={addAttachment}>
            登记链接
          </Button>
        </Space>
      </Card>

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
