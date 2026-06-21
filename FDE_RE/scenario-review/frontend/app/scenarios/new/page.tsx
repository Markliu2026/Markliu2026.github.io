"use client";

import {
  Button,
  Card,
  Form,
  Grid,
  Input,
  Message,
  Select,
  Space,
  Typography,
} from "@arco-design/web-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import { api } from "@/lib/api";
import type { Scenario } from "@/lib/types";

const { Row, Col } = Grid;
const FormItem = Form.Item;

const MODULES = ["PP", "MM", "SD", "FICO", "QM", "PM/EAM", "EWM", "MDG"];
const INDUSTRIES = ["离散制造", "流程制造", "新能源", "消费品", "汽车", "装备制造"];
const AI_CAPS = ["预测", "优化", "生成", "审核", "异常识别", "RAG", "Agent"];
const opts = (arr: string[]) => arr.map((v) => ({ label: v, value: v }));

export default function NewScenarioPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  async function save(submit: boolean) {
    let values;
    try {
      // 草稿仅校验名称；提交则校验全部必填
      values = submit ? await form.validate() : await form.validate(["title"]);
    } catch {
      Message.warning("请补全必填字段");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values,
        kpi_candidates: String(values.kpi_candidates ?? "")
          .split(/[,，、]/)
          .map((s: string) => s.trim())
          .filter(Boolean),
      };
      const sc = await api.post<Scenario>("/api/scenarios", payload);
      if (submit) await api.post(`/api/scenarios/${sc.id}/submit`);
      Message.success(submit ? "已提交，等待初筛" : "草稿已保存");
      router.push(`/scenarios/${sc.id}`);
    } catch (e) {
      Message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer maxWidth={760}>
      <Typography.Title heading={6} style={{ margin: "0 0 2px" }}>
        新建提报
      </Typography.Title>
      <Typography.Text type="secondary">轻量提报表 · 10 分钟内完成（§6.1）</Typography.Text>

      <Card bordered={false} style={{ borderRadius: 8, marginTop: 16 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ willingness_to_pay: "unknown" }}
          requiredSymbol={{ position: "start" }}
        >
          <FormItem label="场景名称" field="title" rules={[{ required: true, message: "请填写场景名称" }]}>
            <Input placeholder="如：需求预测数智工程师" allowClear />
          </FormItem>

          <FormItem label="所属行业" field="industry" rules={[{ required: true, message: "请选择行业" }]}>
            <Select mode="multiple" placeholder="可多选" options={opts(INDUSTRIES)} allowCreate />
          </FormItem>

          <FormItem label="所属模块" field="sap_modules" rules={[{ required: true, message: "请选择模块" }]}>
            <Select mode="multiple" placeholder="可多选" options={opts(MODULES)} />
          </FormItem>

          <FormItem label="AI 能力类型" field="ai_capabilities">
            <Select mode="multiple" placeholder="可多选" options={opts(AI_CAPS)} />
          </FormItem>

          <FormItem label="客户/项目（可脱敏）" field="customer_name">
            <Input placeholder="可填写脱敏代号" allowClear />
          </FormItem>

          <FormItem label="业务痛点" field="pain_point" rules={[{ required: true, message: "请描述业务痛点" }]}>
            <Input.TextArea autoSize={{ minRows: 2 }} placeholder="当前瓶颈与代价" />
          </FormItem>

          <FormItem label="现状如何靠人解决" field="human_process" rules={[{ required: true, message: "请描述人工现状" }]}>
            <Input.TextArea autoSize={{ minRows: 2 }} placeholder="明确经验依赖点" />
          </FormItem>

          <Row gutter={16}>
            <Col span={12}>
              <FormItem label="决策频率" field="frequency">
                <Input placeholder="每日 / 每周 / 月度" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem label="处理数量" field="volume">
                <Input placeholder="如 2000 个 SKU" />
              </FormItem>
            </Col>
          </Row>

          <FormItem
            label="可量化业务KPI（逗号分隔）"
            field="kpi_candidates"
            rules={[{ required: true, message: "请填写至少一个 KPI" }]}
          >
            <Input placeholder="OTD, 库存周转, 月结天数" />
          </FormItem>

          <FormItem label="数据基础" field="data_basis" rules={[{ required: true, message: "请说明数据可得性" }]}>
            <Input.TextArea autoSize={{ minRows: 2 }} placeholder="数据在 SAP / 外围系统 / 文档中是否可得" />
          </FormItem>

          <Row gutter={16}>
            <Col span={12}>
              <FormItem label="客户付费意愿" field="willingness_to_pay">
                <Select
                  options={[
                    { label: "未知", value: "unknown" },
                    { label: "强", value: "strong" },
                    { label: "中", value: "medium" },
                    { label: "弱", value: "weak" },
                  ]}
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem label="预估价值" field="estimated_value">
                <Input placeholder="降本 / 增效 / 增收量级" />
              </FormItem>
            </Col>
          </Row>

          <Space>
            <Button loading={saving} onClick={() => save(false)}>
              保存草稿
            </Button>
            <Button type="primary" loading={saving} onClick={() => save(true)}>
              提交
            </Button>
          </Space>
        </Form>
      </Card>
    </PageContainer>
  );
}
