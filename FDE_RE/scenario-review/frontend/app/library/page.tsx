"use client";

import { Card, Empty, Grid, Space, Spin, Typography } from "@arco-design/web-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { RecoBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import type { Scenario } from "@/lib/types";

const { Row, Col } = Grid;

export default function LibraryPage() {
  const router = useRouter();
  const [items, setItems] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Scenario[]>("/api/scenarios/library").then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <Typography.Title heading={6} style={{ margin: "0 0 2px" }}>
        场景库
      </Typography.Title>
      <Typography.Text type="secondary">推荐深评 / 入库观察的公开场景（§9.1）</Typography.Text>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <Spin />
        ) : items.length === 0 ? (
          <Empty description="暂无公开场景。完成一次初筛流转后这里会出现场景。" />
        ) : (
          <Row gutter={[16, 16]}>
            {items.map((s) => (
              <Col span={12} key={s.id}>
                <Card
                  hoverable
                  style={{ borderRadius: 8, cursor: "pointer", height: "100%" }}
                  onClick={() => router.push(`/scenarios/${s.id}`)}
                >
                  <Space style={{ marginBottom: 8 }}>
                    <Typography.Text style={{ fontWeight: 600, color: "rgb(var(--primary-6))" }}>
                      {s.title}
                    </Typography.Text>
                    <RecoBadge reco={s.latest_recommendation} />
                  </Space>
                  <Space style={{ marginBottom: 8 }}>
                    <StatusBadge status={s.status} />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {s.sap_modules.join("、")}
                    </Typography.Text>
                  </Space>
                  <Typography.Paragraph
                    type="secondary"
                    style={{ margin: 0 }}
                    ellipsis={{ rows: 2 }}
                  >
                    {s.pain_point}
                  </Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </PageContainer>
  );
}
