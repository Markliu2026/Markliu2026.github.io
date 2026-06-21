"use client";

import { Avatar, Badge, Dropdown, Menu, Space } from "@arco-design/web-react";
import { IconExport, IconUser } from "@arco-design/web-react/icon";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Notification, User } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  submitter: "提报人", owner: "Owner", screener: "初筛人", reviewer: "评委",
  ai_rep: "AI研发", manager: "管理层", admin: "管理员",
};

type NavItem = { key: string; path: string; label: string; roles?: string[] };
const ITEMS: NavItem[] = [
  { key: "scenarios", path: "/scenarios", label: "我的提报" },
  { key: "new", path: "/scenarios/new", label: "新建提报" },
  { key: "library", path: "/library", label: "场景库" },
  { key: "screening", path: "/screening", label: "初筛队列", roles: ["screener", "admin"] },
  {
    key: "meetings",
    path: "/meetings",
    label: "评审会",
    roles: ["reviewer", "manager", "screener", "admin"],
  },
  { key: "poc", path: "/poc", label: "POC看板" },
  {
    key: "dashboard",
    path: "/dashboard",
    label: "驾驶舱",
    roles: ["manager", "admin", "screener"],
  },
  { key: "incentive", path: "/incentive", label: "我的贡献" },
  { key: "notifications", path: "/notifications", label: "通知" },
];

export default function Nav() {
  const { user, token, setUser, logout, hydrate } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (token && !user) {
      api.get<User>("/api/auth/me").then(setUser).catch(() => logout());
    }
  }, [token, user, setUser, logout]);

  useEffect(() => {
    if (token) {
      api
        .get<Notification[]>("/api/notifications")
        .then((ns) => setUnread(ns.filter((n) => !n.is_read).length))
        .catch(() => {});
    }
  }, [token, pathname]);

  const roles = user?.roles ?? [];
  const items = ITEMS.filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)));
  const selected =
    items.find((i) => i.path === pathname)?.key ??
    (pathname.startsWith("/scenarios/new") ? "new" : pathname.startsWith("/scenario") ? "scenarios" : "");

  return (
    <div
      style={{
        height: 60,
        background: "#fff",
        borderBottom: "1px solid var(--color-border-2)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ fontWeight: 600, color: "rgb(var(--primary-6))", fontSize: 16, marginRight: 32, whiteSpace: "nowrap" }}>
        🌱 金种子 · 场景提报评审
      </div>
      <Menu
        mode="horizontal"
        selectedKeys={[selected]}
        style={{ flex: 1, border: "none", background: "transparent" }}
        onClickMenuItem={(key) => {
          const it = items.find((i) => i.key === key);
          if (it) router.push(it.path);
        }}
      >
        {items.map((i) => (
          <Menu.Item key={i.key}>
            {i.key === "notifications" && unread > 0 ? (
              <Badge count={unread} dot offset={[6, -2]}>
                {i.label}
              </Badge>
            ) : (
              i.label
            )}
          </Menu.Item>
        ))}
      </Menu>
      <Dropdown
        droplist={
          <Menu
            onClickMenuItem={(k) => {
              if (k === "logout") {
                logout();
                router.push("/login");
              }
            }}
          >
            <Menu.Item key="logout">
              <IconExport style={{ marginRight: 8 }} />
              切换角色 / 退出
            </Menu.Item>
          </Menu>
        }
        position="br"
      >
        <Space style={{ cursor: "pointer" }}>
          <Avatar size={28} style={{ background: "rgb(var(--primary-6))" }}>
            <IconUser />
          </Avatar>
          <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>
            {user ? `${user.display_name}（${user.roles.map((r) => ROLE_LABELS[r] ?? r).join("/")}）` : ""}
          </span>
        </Space>
      </Dropdown>
    </div>
  );
}
