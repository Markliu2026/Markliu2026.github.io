"use client";

import {
  Button,
  Card,
  Descriptions,
  Grid,
  Input,
  InputNumber,
  Message,
  Select,
  Space,
  Statistic,
  Typography,
} from "@arco-design/web-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DeepEval, Scenario, User } from "@/lib/types";

const { Row, Col } = Grid;

const TEXT_FIELDS: [keyof DeepEval, string][] = [
  ["business_process", "业务流程评估"],
  ["data_diligence", "数据尽调"],
  ["ai_capability_fit", "AI能力评估"],
  ["closed_loop", "闭环可行性"],
  ["risks", "风险评估"],
  ["resources", "资源评估"],
  ["productization_potential", "产品化潜力"],
  ["baseline", "ROI baseline 说明"],
];

const ROI_FIELDS: [keyof DeepEval, string][] = [
  ["labor_saving", "人力节省"],
  ["business_improvement", "业务改善"],
  ["risk_reduction", "风险减少"],
  ["revenue_increase", "增收"],
  ["poc_investment", "POC投入"],
  ["productization_investment", "产品化投入"],
  ["ops_cost", "部署运维"],
];

const SHOW_STATES = [
  "deep_eval", "pending_review", "poc_suggest", "poc_running",
  "poc_success", "poc_failed", "productizing", "productized",
];

export default function DeepEvalSection({
  scenario,
  onChange,
}: {
  scenario: Scenario;
  onChange: () => void;
}) {
  const user = useAuth((s) => s.user);
  const roles = user?.roles ?? [];
  const isScreener = roles.includes("screener") || roles.includes("admin");
  const canEdit =
    scenario.status === "deep_eval" &&
    (roles.includes("owner") || roles.includes("admin") || roles.includes("ai_rep"));

  const [owners, setOwners] = useState<User[]>([]);
  const [ownerId, setOwnerId] = useState<string>();
  const [de, setDe] = useState<DeepEval | null>(null);

  useEffect(() => {
    if (scenario.status === "recommend_deep" && isScreener) {
      api.get<User[]>("/api/users?role=owner").then(setOwners).catch(() => {});
    }
    if (SHOW_STATES.includes(scenario.status)) {
      api.get<DeepEval>(`/api/scenarios/${scenario.id}/deep-eval`).then(setDe).catch(() => {});
    }
  }, [scenario.id, scenario.status, isScreener]);

  async function assign() {
    if (!ownerId) return Message.warning("请选择 Owner");
    try {
      await api.post(`/api/scenarios/${scenario.id}/assign-owner`, { owner_id: ownerId });
      Message.success("已指定 Owner，进入深评");
      onChange();
    } catch (e) {
      Message.error((e as Error).message);
    }
  }

  async function save(submit: boolean) {
    if (!de) return;
    try {
      const saved = await api.put<DeepEval>(`/api/scenarios/${scenario.id}/deep-eval`, de);
      setDe(saved);
      if (submit) {
        await api.post(`/api/scenarios/${scenario.id}/submit-review`);
        Message.success("已提交评审会");
        onChange();
      } else {
        Message.success("深评材料已保存");
      }
    } catch (e) {
      Message.error((e as Error).message);
    }
  }

  // 指定 Owner（推荐深评阶段，初筛人可见）
  if (scenario.status === "recommend_deep" && isScreener) {
    return (
      <Card bordered={false} style={{ borderRadius: 8, marginTop: 16 }} title="进入深度评估">
        <Space>
          <Typography.Text type="secondary">指定场景 Owner：</Typography.Text>
          <Select
            style={{ width: 220 }}
            placeholder="选择 Owner"
            value={ownerId}
            onChange={setOwnerId}
            options={owners.map((u) => ({ label: `${u.display_name}`, value: u.id }))}
          />
          <Button type="primary" onClick={assign}>
            指定并进入深评
          </Button>
        </Space>
      </Card>
    );
  }

  if (!de || !SHOW_STATES.includes(scenario.status)) return null;

  const annual =
    (de.labor_saving || 0) + (de.business_improvement || 0) + (de.risk_reduction || 0) +
    (de.revenue_increase || 0);
  const total = (de.poc_investment || 0) + (de.productization_investment || 0) + (de.ops_cost || 0);
  const roiMul = total > 0 ? annual / total : null;
  const payback = annual > 0 ? total / (annual / 12) : null;

  // 编辑态（Owner 在深评中）
  if (canEdit) {
    return (
      <Card bordered={false} style={{ borderRadius: 8, marginTop: 16 }} title="深度评估材料（§6.4）">
        {TEXT_FIELDS.map(([k, label]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <Typography.Text style={{ fontSize: 13, color: "var(--color-text-2)" }}>
              {label}
            </Typography.Text>
            <Input.TextArea
              autoSize={{ minRows: 1 }}
              value={(de[k] as string) ?? ""}
              onChange={(v) => setDe({ ...de, [k]: v })}
            />
          </div>
        ))}
        <Typography.Text style={{ fontWeight: 600 }}>ROI 测算（万元/年，§6.7.3）</Typography.Text>
        <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
          {ROI_FIELDS.map(([k, label]) => (
            <Col span={6} key={k}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {label}
              </Typography.Text>
              <InputNumber
                style={{ width: "100%" }}
                value={de[k] as number}
                onChange={(v) => setDe({ ...de, [k]: v ?? 0 })}
                min={0}
              />
            </Col>
          ))}
        </Row>
        <Card
          style={{ background: "var(--color-fill-1)", marginTop: 12, borderRadius: 8 }}
          bodyStyle={{ padding: 12 }}
          bordered={false}
        >
          <Space size="large">
            <Statistic title="年化收益" value={annual} suffix="万" />
            <Statistic title="总投入" value={total} suffix="万" />
            <Statistic title="ROI倍数" value={roiMul ?? 0} precision={2} />
            <Statistic title="回收期(月)" value={payback ?? 0} precision={1} />
          </Space>
        </Card>
        <Space style={{ marginTop: 16 }}>
          <Button onClick={() => save(false)}>保存</Button>
          <Button type="primary" onClick={() => save(true)}>
            提交评审会
          </Button>
        </Space>
      </Card>
    );
  }

  // 只读摘要
  const data = [
    ...TEXT_FIELDS.filter(([k]) => de[k]).map(([k, label]) => ({
      label,
      value: de[k] as string,
      span: 2,
    })),
    { label: "年化收益", value: `${de.annual_benefit ?? annual} 万` },
    { label: "总投入", value: `${de.total_investment ?? total} 万` },
    { label: "ROI倍数", value: de.roi_multiple ?? roiMul ?? "—" },
    { label: "回收期(月)", value: de.payback_months ?? payback ?? "—" },
  ];
  return (
    <Card bordered={false} style={{ borderRadius: 8, marginTop: 16 }} title="深度评估材料">
      <Descriptions
        column={2}
        colon=" :"
        labelStyle={{ color: "var(--color-text-3)", width: 100 }}
        data={data}
      />
    </Card>
  );
}
