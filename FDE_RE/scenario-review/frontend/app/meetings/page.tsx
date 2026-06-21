"use client";

import {
  Button,
  Card,
  Empty,
  Grid,
  Message,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Meeting, ReviewItem, Scenario } from "@/lib/types";

const { Row, Col } = Grid;
const CONCLUSIONS = [
  { label: "POC建议", value: "poc_suggest" },
  { label: "入库观察", value: "observing" },
  { label: "淘汰", value: "rejected" },
  { label: "退回补充深评", value: "deep_eval" },
];

export default function MeetingsPage() {
  const roles = useAuth((s) => s.user?.roles) ?? [];
  const canReview = ["reviewer", "manager", "admin"].some((r) => roles.includes(r));
  const canManage = ["screener", "manager", "admin"].some((r) => roles.includes(r));

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [active, setActive] = useState<Meeting | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Scenario[]>([]);

  async function loadMeetings() {
    setMeetings(await api.get<Meeting[]>("/api/meetings"));
  }
  useEffect(() => {
    loadMeetings().catch((e) => Message.error((e as Error).message));
  }, []);

  async function open(m: Meeting) {
    setActive(m);
    const its = await api.get<ReviewItem[]>(`/api/meetings/${m.id}/items`);
    setItems(its);
    const entries = await Promise.all(
      its.map(async (it) => {
        const s = await api.get<Scenario>(`/api/scenarios/${it.scenario_id}`);
        return [it.scenario_id, s.title] as const;
      }),
    );
    setTitles(Object.fromEntries(entries));
  }

  async function createMeeting() {
    const title = `评审会 ${new Date().toLocaleDateString("zh-CN")}`;
    await api.post("/api/meetings", { title, meeting_type: "deep" });
    Message.success("已创建评审会");
    await loadMeetings();
  }

  async function addItem(meetingId: string) {
    const queue = await api.get<Scenario[]>("/api/scenarios/review-queue").catch(() => []);
    setPending(queue);
    if (queue.length === 0) {
      Message.info("当前没有待评审会的场景（pending_review）");
      return;
    }
    Modal.confirm({
      title: "添加议题（选择待评审场景）",
      content: (
        <AddItemForm
          scenarios={queue}
          onAdd={async (sid) => {
            await api.post(`/api/meetings/${meetingId}/items`, { scenario_id: sid });
            Message.success("已添加议题");
            const m = meetings.find((x) => x.id === meetingId);
            if (m) await open(m);
          }}
        />
      ),
      footer: null,
    });
  }

  async function vote(itemId: string) {
    await api.post(`/api/meetings/items/${itemId}/votes`, {
      vote: "pass",
      business_value_score: 4,
      feasibility_score: 4,
      replicability_score: 4,
      strategic_fit_score: 4,
    });
    const sm = await api.get<{ count: number; avg_weighted: number | null }>(
      `/api/meetings/items/${itemId}/votes`,
    );
    Message.success(`已投票（通过）。当前 ${sm.count} 票，均分 ${sm.avg_weighted ?? "-"}`);
  }

  async function conclude(itemId: string, conclusion: string) {
    try {
      await api.post(`/api/meetings/items/${itemId}/conclude`, { conclusion });
      Message.success("已给出结论");
      if (active) await open(active);
    } catch (e) {
      Message.error((e as Error).message);
    }
  }

  return (
    <PageContainer>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Typography.Title heading={6} style={{ margin: 0 }}>
          评审会
        </Typography.Title>
        {canManage && (
          <Button type="primary" onClick={createMeeting}>
            新建评审会
          </Button>
        )}
      </div>
      <Row gutter={20}>
        <Col span={8}>
          {meetings.length === 0 ? (
            <Empty description="暂无评审会" />
          ) : (
            <Space direction="vertical" style={{ width: "100%" }}>
              {meetings.map((m) => (
                <Card
                  key={m.id}
                  hoverable
                  bodyStyle={{ padding: 12 }}
                  style={{ borderRadius: 8, cursor: "pointer", borderColor: active?.id === m.id ? "rgb(var(--primary-6))" : undefined }}
                  onClick={() => open(m)}
                >
                  <Typography.Text style={{ fontWeight: 600 }}>{m.title}</Typography.Text>
                  <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 4 }}>
                    {m.meeting_type} · {m.status}
                  </div>
                </Card>
              ))}
            </Space>
          )}
        </Col>
        <Col span={16}>
          {!active ? (
            <Card bordered={false} style={{ borderRadius: 8 }}>
              <Empty description="选择一个评审会查看议题" />
            </Card>
          ) : (
            <Card
              bordered={false}
              style={{ borderRadius: 8 }}
              title={active.title}
              extra={canManage ? <Button size="small" onClick={() => addItem(active.id)}>添加议题</Button> : null}
            >
              {items.length === 0 && <Empty description="暂无议题" />}
              {items.map((it) => (
                <Card key={it.id} style={{ marginBottom: 12, borderRadius: 8 }} bodyStyle={{ padding: 12 }}>
                  <Space>
                    <Typography.Text style={{ fontWeight: 600 }}>
                      {titles[it.scenario_id] ?? it.scenario_id}
                    </Typography.Text>
                    {it.conclusion && <Tag color="green">结论：{it.conclusion}</Tag>}
                  </Space>
                  {canReview && !it.conclusion && (
                    <div style={{ marginTop: 10 }}>
                      <Space wrap>
                        <Button size="small" onClick={() => vote(it.id)}>
                          投票通过(四维4分)
                        </Button>
                        <Select
                          size="small"
                          placeholder="给出结论"
                          style={{ width: 160 }}
                          options={CONCLUSIONS}
                          onChange={(v) => conclude(it.id, v)}
                        />
                      </Space>
                    </div>
                  )}
                </Card>
              ))}
            </Card>
          )}
        </Col>
      </Row>
    </PageContainer>
  );
}

function AddItemForm({
  scenarios,
  onAdd,
}: {
  scenarios: Scenario[];
  onAdd: (sid: string) => void;
}) {
  const [sid, setSid] = useState("");
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Select
        placeholder="选择待评审会场景"
        value={sid || undefined}
        onChange={setSid}
        options={scenarios.map((s) => ({ label: s.title, value: s.id }))}
        style={{ width: "100%" }}
      />
      <Button type="primary" onClick={() => onAdd(sid)} disabled={!sid}>
        添加
      </Button>
    </Space>
  );
}
