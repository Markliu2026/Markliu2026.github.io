# 场景提报与评审系统 — 后端（MVP一期）

提报与初筛闭环。技术栈对齐团队 APS_AI：Python 3.12 + FastAPI + SQLAlchemy 2 异步 + Pydantic 2（uv 管理）。
MVP一期默认 SQLite（零基础设施即可运行），代码保持 PostgreSQL 可移植（改 `DATABASE_URL` 即可）。

## 运行

```bash
cd backend
uv sync                       # 安装依赖（自动准备 Python 3.12）
uv run python -m app.seed     # 建表 + 种子数据（各角色账号 + 示例场景）
uv run uvicorn app.main:app --reload --port 8099
```

API 文档：http://localhost:8099/docs

## 种子账号（默认密码 `Passw0rd!`）

| 账号 | 角色 |
|---|---|
| consultant | 提报人 |
| owner | Owner + 提报人 |
| screener | 创新中心初筛人 |
| reviewer | 评审委员 |
| airep | AI 研发代表 |
| manager | 管理层 |
| admin | 系统管理员 |

## MVP一期能力

- 用户与角色、JWT 登录、RBAC（§3 / §17）
- 轻量提报表 CRUD、提交完整性校验（§6.1）
- 我的提报、场景库列表、初筛队列（§9）
- 四维加权评分与 P0/P1/P2/淘汰分级（§6.3）
- 否决项命中强制降级（§6.3.3）
- 场景状态机流转（§5）
- 评论、附件登记（样本仅存链接，§11.2）
- 站内通知（§10）

## 主要接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/auth/login | 登录获取 token |
| GET | /api/auth/me | 当前用户 |
| POST | /api/scenarios | 新建草稿 |
| PATCH | /api/scenarios/{id} | 编辑（草稿/待补充） |
| POST | /api/scenarios/{id}/submit | 提交 |
| GET | /api/scenarios/mine | 我的提报 |
| GET | /api/scenarios/library | 公开场景库 |
| GET | /api/scenarios/screening-queue | 初筛队列（初筛人） |
| POST | /api/scenarios/{id}/scores | 四维评分（初筛人） |
| POST | /api/scenarios/{id}/transition | 状态流转（初筛人） |
| GET/POST | /api/scenarios/{id}/comments | 评论 |
| GET/POST | /api/scenarios/{id}/attachments | 附件登记 |
| GET | /api/notifications | 我的通知 |
