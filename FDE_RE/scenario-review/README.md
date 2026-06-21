# 场景提报与评审系统

SAP数智工程师「金种子」场景提报与评审系统 —— 全链路实现（一/二/三期）。
依据 `FDE_RE/SAP数智工程师场景提报与评审系统设计.md` 的技术选型与架构（§15–§21）实现，技术栈对齐团队 APS_AI。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Next.js 16（App Router）+ React 19 + TypeScript + **Arco Design**（字节）+ Zustand |
| 后端 | Python 3.12 + FastAPI + SQLAlchemy 2 异步 + Pydantic 2（uv） |
| 数据库 | 默认 SQLite（零基础设施），代码保持 PostgreSQL 16 可移植 |
| 鉴权 | JWT + RBAC（状态机为权限单一权威） |

## 快速开始

```bash
# 终端 1 — 后端
cd backend
uv sync
uv run python -m app.seed                 # 建表 + 种子（角色账号 + 6 案例样版 + POC 示例）
uv run uvicorn app.main:app --reload --port 8099

# 终端 2 — 前端
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                                # http://localhost:3100
```

演示账号（密码均 `Passw0rd!`）：`consultant` / `owner` / `screener` / `reviewer` / `manager` / `admin`。

## 已实现模块（对应设计文档）

| 阶段 | 模块 | 章节 | 入口 |
|---|---|---|---|
| 一期 | 提报 / 我的提报 / 场景库 | §6.1 / §9.1 | `/scenarios`、`/scenarios/new`、`/library` |
| 一期 | 初筛队列 + 四维评分 + 否决项降级 | §6.3 | `/screening` |
| 一期 | 状态机 / 评论 / 附件 / 通知 | §5 / §10 / §11.2 | 详情页、`/notifications` |
| 二期 | 深度评估（深评材料 + ROI 测算）| §6.4 / §6.7.3 | 详情页 · 指定 Owner→深评卡 |
| 二期 | 评审会（会议 / 议题 / 四维投票 / 结论）| §6.5 | `/meetings` |
| 二期 | POC 看板（阶段 / 里程碑 / 价值指标 / 周报 / 结项）| §6.6 / §6.7 | `/poc` |
| 三期 | 产品化资产 | §6.8 | `/api/products`、详情页立项/产品化按钮 |
| 三期 | 激励积分 + 金种子贡献档案 + 排行榜 | §6.9 | `/incentive` |
| 三期 | 管理驾驶舱（漏斗 / 分布 / ROI）| §9.4 / §12 | `/dashboard` |

## 全链路（已端到端验证 + 自动化测试）

提报 → 提交 → 初筛四维评分（P0/P1，否决项降级）→ 推荐深评 → 指定 Owner → 深评材料 + ROI 测算
→ 提交评审会 → 评委投票 + 结论 → POC 建议 → 管理层立项 → POC 看板（里程碑/指标/周报）→ 结项成功
→ 产品化中 → 已产品化 + 资产；全程按 §6.9.1 自动发放积分（全链路 1040 分）并汇入贡献档案与驾驶舱。

## 测试

```bash
cd backend
uv run pytest -q          # 13 项：单元(评分/ROI/状态机) + 集成(全链路 + RBAC)
uv run ruff check app/ tests/
cd ../frontend && npm run build   # 类型检查 + 13 路由构建
```

## 部署

容器化见 `DEPLOY.md`：`docker compose up -d --build`（PostgreSQL + 后端 + 前端，宿主端口 3100）。

## 目录

```
scenario-review/
  backend/   app/{models,schemas,services,api}, seed.py, tests/
  frontend/  app/ 路由, components/, lib/
  docker-compose.yml, DEPLOY.md
```

> 公开静态演示页 `../../scenario-review.html`（GitHub Pages）覆盖一期闭环的纯前端 Demo；
> 二/三期完整能力请运行上面的全栈应用体验。
