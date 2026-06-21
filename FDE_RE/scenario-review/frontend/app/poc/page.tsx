"use client";

import {
  Button,
  Card,
  Checkbox,
  Empty,
  Grid,
  Input,
  Message,
  Table,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Milestone, Poc, Scenario, ValueMetric } from "@/lib/types";
import { METRIC_CAT_LABELS, POC_STAGE_LABELS } from "@/lib/types";

const { Row, Col } = Grid;
const STAGES = ["kickoff", "diagnose", "mvp", "closedloop", "validate", "done"];
const RISK_COLOR: Record<string, string> = { low: "green", mid: "orange", high: "red" };

export default function PocPage() {
  const roles = useAuth((s) => s.user?.roles) ?? [];
  const canEdit = ["owner", "screener", "admin", "manager"].some((r) => roles.includes(r));
  const [pocs, setPocs] = useState<Poc[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [active, setActive] = useState<Poc | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [metrics, setMetrics] = useState<ValueMetric[]>([]);

  async function loadList() {
    const list = await api.get<Poc[]>("/api/poc");
    setPocs(list);
    const entries = await Promise.all(
      list.map(async (p) => {
        try {
          const s = await api.get<Scenario>(`/api/scenarios/${p.scenario_id}`);
          return [p.id, s.title] as const;
        } catch {
          return [p.id, "(场景)"] as const;
        }
      }),
    );
    setTitles(Object.fromEntries(entries));
  }
  useEffect(() => {
    loadList().catch((e) => Message.error((e as Error).message));
  }, []);

  async function open(p: Poc) {
    setActive(p);
    setMilestones(await api.get<Milestone[]>(`/api/poc/${p.id}/milestones`));
    setMetrics(await api.get<ValueMetric[]>(`/api/poc/${p.id}/metrics`));
  }

  async function saveWeekly() {
    if (!active) return;
    await api.put(`/api/poc/${active.id}`, {
      stage: active.stage,
      risk_level: active.risk_level,
      progress: active.progress,
      next_plan: active.next_plan,
      blockers: active.blockers,
    });
    Message.success("已更新");
    await loadList();
  }
  async function toggleMs(id: string) {
    await api.put(`/api/poc/milestones/${id}/toggle`);
    if (active) setMilestones(await api.get<Milestone[]>(`/api/poc/${active.id}/milestones`));
  }
  async function finish(success: boolean) {
    if (!active) return;
    await api.post(`/api/poc/${active.id}/finish`, { success });
    Message.success(success ? "POC 成功" : "POC 未通过");
    setActive(null);
    await loadList();
  }

  return (
    <PageContainer>
      <Typography.Title heading={6} style={{ marginTop: 0 }}>
        POC 看板
      </Typography.Title>
      {pocs.length === 0 ? (
        <Empty description="暂无 POC 项目（评审通过并立项后出现）" />
      ) : (
        <Row gutter={[16, 16]}>
          {pocs.map((p) => (
            <Col span={8} key={p.id}>
              <Card
                hoverable
                style={{ borderRadius: 8, cursor: "pointer" }}
                onClick={() => open(p)}
                title={titles[p.id] ?? "POC"}
                extra={<Tag color={p.result === "success" ? "green" : p.result === "failed" ? "red" : "arcoblue"}>{p.result}</Tag>}
              >
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {p.customer || "—"}
                </Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="cyan">{POC_STAGE_LABELS[p.stage] ?? p.stage}</Tag>
                  <Tag color={RISK_COLOR[p.risk_level]}>风险:{p.risk_level}</Tag>
                  {p.baseline_locked && <Tag color="gold">baseline已锁</Tag>}
                </div>
                {p.progress && (
                  <Typography.Paragraph
                    type="secondary"
                    style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}
                    ellipsis={{ rows: 2 }}
                  >
                    本周：{p.progress}
                  </Typography.Paragraph>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {active && (
        <Card
          bordered={false}
          style={{ borderRadius: 8, marginTop: 16 }}
          title={`POC 详情 · ${titles[active.id] ?? ""}`}
          extra={
            canEdit && active.result === "running" ? (
              <Button.Group>
                <Button status="success" onClick={() => finish(true)}>
                  结项成功
                </Button>
                <Button status="danger" onClick={() => finish(false)}>
                  未通过
                </Button>
              </Button.Group>
            ) : null
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Typography.Text style={{ fontWeight: 600 }}>里程碑（§6.6.1）</Typography.Text>
              <div style={{ marginTop: 8 }}>
                {milestones.map((m) => (
                  <div key={m.id} style={{ padding: "4px 0" }}>
                    <Checkbox checked={m.done} disabled={!canEdit} onChange={() => toggleMs(m.id)}>
                      <Tag size="small" color="cyan" style={{ marginRight: 6 }}>
                        {POC_STAGE_LABELS[m.stage ?? ""] ?? m.stage}
                      </Tag>
                      {m.name}
                    </Checkbox>
                  </div>
                ))}
                {milestones.length === 0 && (
                  <Typography.Text type="secondary">暂无里程碑</Typography.Text>
                )}
              </div>
            </Col>
            <Col span={12}>
              <Typography.Text style={{ fontWeight: 600 }}>价值指标（§6.7）</Typography.Text>
              <Table
                style={{ marginTop: 8 }}
                size="small"
                rowKey="id"
                pagination={false}
                data={metrics}
                columns={[
                  { title: "类别", dataIndex: "category", render: (c) => METRIC_CAT_LABELS[c] ?? c },
                  { title: "指标", dataIndex: "name" },
                  { title: "基线", dataIndex: "baseline" },
                  { title: "目标", dataIndex: "target" },
                  { title: "实际", dataIndex: "actual" },
                ]}
                noDataElement="暂无指标"
              />
            </Col>
          </Row>

          {canEdit && active.result === "running" && (
            <div style={{ marginTop: 16 }}>
              <Typography.Text style={{ fontWeight: 600 }}>周报更新</Typography.Text>
              <Input.TextArea
                style={{ marginTop: 8 }}
                placeholder="本周进展"
                value={active.progress ?? ""}
                onChange={(v) => setActive({ ...active, progress: v })}
                autoSize={{ minRows: 1 }}
              />
              <Input.TextArea
                style={{ marginTop: 8 }}
                placeholder="下周计划"
                value={active.next_plan ?? ""}
                onChange={(v) => setActive({ ...active, next_plan: v })}
                autoSize={{ minRows: 1 }}
              />
              <Input.TextArea
                style={{ marginTop: 8 }}
                placeholder="阻塞事项"
                value={active.blockers ?? ""}
                onChange={(v) => setActive({ ...active, blockers: v })}
                autoSize={{ minRows: 1 }}
              />
              <Button type="primary" style={{ marginTop: 12 }} onClick={saveWeekly}>
                保存周报
              </Button>
            </div>
          )}
        </Card>
      )}
    </PageContainer>
  );
}
