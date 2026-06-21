"use client";

import { Card, Empty, List, Tag, Typography } from "@arco-design/web-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Notification[]>("/api/notifications").then(setItems).finally(() => setLoading(false));
  }, []);

  async function read(n: Notification) {
    if (!n.is_read) {
      await api.post(`/api/notifications/${n.id}/read`);
      setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    if (n.scenario_id) router.push(`/scenarios/${n.scenario_id}`);
  }

  return (
    <PageContainer maxWidth={760}>
      <Typography.Title heading={6} style={{ margin: "0 0 16px" }}>
        通知
      </Typography.Title>
      <Card bordered={false} style={{ borderRadius: 8 }} bodyStyle={{ padding: items.length ? 0 : 24 }}>
        {!loading && items.length === 0 ? (
          <Empty description="暂无通知" />
        ) : (
          <List
            loading={loading}
            dataSource={items}
            render={(n) => (
              <List.Item
                key={n.id}
                style={{
                  cursor: "pointer",
                  background: n.is_read ? undefined : "var(--color-primary-light-1)",
                }}
                onClick={() => read(n)}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {!n.is_read && (
                        <Tag color="arcoblue" size="small" style={{ marginRight: 8 }}>
                          未读
                        </Tag>
                      )}
                      {n.title}
                    </span>
                  }
                  description={
                    <span>
                      {n.body ? <div>{n.body}</div> : null}
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(n.created_at).toLocaleString("zh-CN")}
                      </Typography.Text>
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </PageContainer>
  );
}
