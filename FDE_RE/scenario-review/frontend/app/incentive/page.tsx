"use client";

import { Card, Grid, Statistic, Table, Tag, Typography } from "@arco-design/web-react";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { api } from "@/lib/api";
import type { ContributionProfile, PointRecord } from "@/lib/types";

const { Row, Col } = Grid;

const EVENT_LABELS: Record<string, string> = {
  valid_submit: "有效提报",
  pass_screening: "通过初筛",
  poc_suggest: "进入POC建议",
  poc_kickoff: "POC立项",
  poc_success: "POC成功",
  productized: "产品化成功",
  reuse_case: "提供复用案例",
};

export default function IncentivePage() {
  const [profile, setProfile] = useState<ContributionProfile | null>(null);
  const [points, setPoints] = useState<PointRecord[]>([]);
  const [board, setBoard] = useState<ContributionProfile[]>([]);

  useEffect(() => {
    api.get<ContributionProfile>("/api/incentive/profile").then(setProfile).catch(() => {});
    api.get<PointRecord[]>("/api/incentive/my").then(setPoints).catch(() => {});
    api.get<ContributionProfile[]>("/api/incentive/leaderboard").then(setBoard).catch(() => {});
  }, []);

  const stats: [string, number][] = profile
    ? [
        ["总积分", profile.total_points],
        ["有效提报", profile.submit_count],
        ["P0/P1 场景", profile.p0p1_count],
        ["POC 立项", profile.poc_count],
        ["POC 成功", profile.poc_success_count],
        ["已产品化", profile.productized_count],
      ]
    : [];

  return (
    <PageContainer>
      <Typography.Title heading={6} style={{ marginTop: 0 }}>
        金种子贡献档案
      </Typography.Title>

      <Row gutter={[16, 16]}>
        {stats.map(([label, value]) => (
          <Col span={4} key={label}>
            <Card bordered={false} style={{ borderRadius: 8 }}>
              <Statistic title={label} value={value} groupSeparator />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card bordered={false} style={{ borderRadius: 8 }} title="我的积分明细">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              data={points}
              noDataElement="暂无积分"
              columns={[
                {
                  title: "事件",
                  dataIndex: "event",
                  render: (e) => <Tag color="arcoblue">{EVENT_LABELS[e] ?? e}</Tag>,
                },
                { title: "积分", dataIndex: "points", render: (p) => `+${p}` },
                {
                  title: "时间",
                  dataIndex: "created_at",
                  render: (t) => new Date(t).toLocaleDateString("zh-CN"),
                },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false} style={{ borderRadius: 8 }} title="金种子排行榜">
            <Table
              rowKey="user_id"
              size="small"
              pagination={false}
              data={board}
              noDataElement="暂无数据"
              columns={[
                {
                  title: "#",
                  render: (_c, _r, i) => i + 1,
                  width: 50,
                },
                { title: "顾问", dataIndex: "display_name" },
                { title: "积分", dataIndex: "total_points" },
                { title: "POC成功", dataIndex: "poc_success_count" },
                { title: "产品化", dataIndex: "productized_count" },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
