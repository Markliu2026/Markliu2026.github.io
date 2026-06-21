"use client";

import { Button, Card, Table, Typography } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { RecoBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Scenario } from "@/lib/types";

export default function MyScenariosPage() {
  const router = useRouter();
  const [items, setItems] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    api
      .get<Scenario[]>("/api/scenarios/mine")
      .then(setItems)
      .finally(() => setLoading(false));
  }, [router]);

  const columns = [
    {
      title: "场景名称",
      dataIndex: "title",
      render: (t: string, r: Scenario) => (
        <Button type="text" style={{ padding: 0 }} onClick={() => router.push(`/scenarios/${r.id}`)}>
          {t}
        </Button>
      ),
    },
    {
      title: "SAP 模块",
      dataIndex: "sap_modules",
      render: (m: string[]) => m.join("、") || "—",
    },
    { title: "状态", dataIndex: "status", render: (s: string) => <StatusBadge status={s} /> },
    {
      title: "初筛分",
      dataIndex: "latest_weighted_score",
      render: (v: number | null) => v ?? "—",
      width: 90,
    },
    {
      title: "结论",
      dataIndex: "latest_recommendation",
      render: (r: string | null) => <RecoBadge reco={r} />,
      width: 130,
    },
  ];

  return (
    <PageContainer>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Typography.Title heading={6} style={{ margin: 0 }}>
          我的提报
        </Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => router.push("/scenarios/new")}>
          新建提报
        </Button>
      </div>
      <Card bordered={false} style={{ borderRadius: 8 }} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          data={items}
          pagination={items.length > 10 ? { pageSize: 10 } : false}
          noDataElement="还没有提报，点击右上角新建。"
        />
      </Card>
    </PageContainer>
  );
}
