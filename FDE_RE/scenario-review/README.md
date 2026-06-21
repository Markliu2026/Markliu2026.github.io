# 场景提报与评审系统（MVP一期）

SAP数智工程师「金种子」场景提报与评审系统 —— **MVP一期：提报与初筛闭环**。
依据 `FDE_RE/SAP数智工程师场景提报与评审系统设计.md` 的技术选型与架构（§15–§21）实现，技术栈对齐团队 APS_AI。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Next.js 16（App Router）+ React 19 + TypeScript + Tailwind 4 + Zustand |
| 后端 | Python 3.12 + FastAPI + SQLAlchemy 2 异步 + Pydantic 2（uv） |
| 数据库 | MVP一期默认 SQLite（零基础设施），代码保持 PostgreSQL 16 可移植 |
| 鉴权 | JWT + RBAC |

> 说明：一期按 §21.3「最小技术集」落地，pgvector 语义去重、ARQ 异步、对象存储等留待二期引入。

## 快速开始

两个终端分别启动后端与前端：

```bash
# 终端 1 — 后端
cd backend
uv sync
uv run python -m app.seed                 # 建表 + 种子（各角色账号 + 示例场景）
uv run uvicorn app.main:app --reload --port 8099

# 终端 2 — 前端
cd frontend
npm install
cp .env.local.example .env.local          # BACKEND_URL=http://localhost:8099
npm run dev                                # http://localhost:3000
```

打开 http://localhost:3000 ，用演示账号登录（密码均为 `Passw0rd!`）：
`consultant`（提报人）/ `screener`（初筛人）/ `reviewer` / `manager` / `admin`。

## 已实现功能（对应设计文档）

| 模块 | 章节 | 页面 / 接口 |
|---|---|---|
| 用户与角色、登录、RBAC | §3 / §17 | 登录页，`/api/auth/*` |
| 轻量提报表 + 提交校验 | §6.1 | 新建提报，`POST /api/scenarios`、`/submit` |
| 我的提报 | §9.1 | `/scenarios` |
| 场景库 | §9.1 | `/library` |
| 初筛队列 + 四维评分面板 | §6.3 / §9.2 | `/screening` |
| 四维加权评分 + P0/P1/P2/淘汰分级 | §6.3.1/.2 | `POST /api/scenarios/{id}/scores` |
| 否决项命中强制降级 | §6.3.3 | 评分服务 |
| 状态机流转 | §5 | `POST /api/scenarios/{id}/transition` |
| 评论、附件登记 | §6 / §11.2 | 详情页 |
| 站内通知 | §10 | `/api/notifications` |

## 验证过的闭环

提报人新建草稿 → 提交（完整性校验、通知初筛人）→ 初筛人在队列中四维评分（加权分 4.4 → P0；命中否决项时高分被强制降级为补充）→ 状态流转至推荐深评 → 提报人收到反馈通知 → 场景进入公开场景库。RBAC 已验证（顾问访问初筛队列/评分接口均 403）。

## 目录

```
scenario-review/
  backend/   FastAPI 后端（app/models|schemas|services|api，seed.py）
  frontend/  Next.js 前端（app/ 路由，lib/ api·auth·types，components/）
```
