"use client";

import { Alert, Card, Grid, Typography } from "@arco-design/web-react";
import { IconUserGroup } from "@arco-design/web-react/icon";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const { Row, Col } = Grid;

const ACCOUNTS: [string, string, string][] = [
  ["consultant", "提报人", "提交场景、查看反馈"],
  ["screener", "初筛人", "去重、四维评分、状态流转"],
  ["reviewer", "评委", "评审打分与投票"],
  ["manager", "管理层", "看板与资源审批"],
  ["admin", "管理员", "全量权限"],
];

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuth((s) => s.setToken);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  async function loginAs(username: string) {
    setError("");
    setLoading(username);
    try {
      const token = await login(username, "Passw0rd!");
      setToken(token);
      router.push("/scenarios");
    } catch (err) {
      setError((err as Error).message);
      setLoading("");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg,#eef4ff 0%,#f7f8fa 55%)",
        padding: 24,
      }}
    >
      <Card style={{ width: 540, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }} bordered={false}>
        <Typography.Title heading={5} style={{ marginTop: 0, color: "rgb(var(--primary-6))" }}>
          🌱 金种子场景提报评审系统
        </Typography.Title>
        <Typography.Text type="secondary">MVP一期 · 提报与初筛闭环</Typography.Text>

        {error && <Alert type="error" content={error} style={{ margin: "16px 0" }} />}

        <Typography.Paragraph style={{ marginTop: 20, marginBottom: 10 }}>
          <IconUserGroup style={{ marginRight: 6 }} />
          选择一个角色进入（演示环境，免密码）：
        </Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {ACCOUNTS.map(([u, label, desc]) => (
            <Col span={12} key={u}>
              <Card
                hoverable
                onClick={() => loginAs(u)}
                style={{ cursor: "pointer", borderRadius: 8 }}
                bodyStyle={{ padding: 14 }}
                loading={loading === u}
              >
                <div style={{ fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 2 }}>{desc}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 2 }}>{u}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
      <Typography.Text type="secondary" style={{ marginTop: 24, fontSize: 12 }}>
        SAP数智工程师创新中心 · 金种子场景众包计划
      </Typography.Text>
    </div>
  );
}
