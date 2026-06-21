# 部署指南（Docker 容器化 / 自托管）

整套系统用 Docker Compose 一键拉起：**PostgreSQL 16 + 后端(FastAPI) + 前端(Next.js standalone)**。
生产数据库由 SQLite 切换为 PostgreSQL（后端已内置 asyncpg 支持，仅改 `DATABASE_URL`）。

## 拓扑

```
浏览器 ──▶ 宿主:3100 → frontend容器:3000 ──(服务端 /api 代理)──▶ backend:8099 ──▶ db:5432 (postgres)
                 │                                          │
            宿主对外暴露 3100                          仅集群内网络
```

- 浏览器只访问前端（宿主 3100，映射到容器内 3000）；前端 Next 服务端把 `/api/*` 代理到 `backend:8099`，因此**无跨域、后端不必对公网暴露**。
- 数据持久化在命名卷 `pgdata`。

## 一键启动

```bash
cd FDE_RE/scenario-review
cp .env.docker.example .env      # 按需修改密码/端口/密钥（生产必改）
docker compose up -d --build
```

启动后：
- 前端： http://localhost:3100
- 后端健康检查（容器内）： `docker compose exec backend curl -s localhost:8099/health`
- 首次启动会自动写入种子数据（`SEED_ON_START=1`，幂等；库非空则跳过）。

演示账号（密码 `Passw0rd!`）：`consultant` / `screener` / `reviewer` / `manager` / `admin`。

## 常用运维

```bash
docker compose logs -f backend          # 看后端日志
docker compose ps                       # 查看服务状态
docker compose down                     # 停止（保留数据卷）
docker compose down -v                  # 停止并清空数据库卷
docker compose up -d --build backend    # 仅重建后端
```

## 生产注意事项

| 项 | 说明 |
|---|---|
| 密钥 | `.env` 中 `JWT_SECRET`、`DB_PASSWORD` 必须改为强随机值 |
| HTTPS | 前置 Nginx/Caddy/云负载均衡做 TLS 终止，反代到宿主 3100（容器内 3000） |
| 迁移 | 当前用 `create_all` 自动建表；正式版改用 Alembic 迁移（架构 §15 已选型） |
| 备份 | 定期备份 `pgdata` 卷或 `pg_dump` |
| 扩展 | 二期引入 pgvector：把 `db` 镜像换为 `pgvector/pgvector:pg16` 并启用扩展（架构 §15/§19） |

## 镜像说明

- **后端**：`python:3.12-slim` + uv，`uv sync --frozen --no-dev` 安装锁定依赖，`uvicorn` 提供服务。
- **前端**：多阶段构建，`next build` 产出 `output: "standalone"`，运行镜像仅含 `server.js` + 最小依赖，体积小、启动快。
