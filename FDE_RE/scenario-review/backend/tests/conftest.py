"""测试夹具：独立 SQLite 测试库 + 已种子的 ASGI 客户端。"""
from __future__ import annotations

import os
import pathlib

# 必须在导入 app.* 之前设置，使 settings 读取测试库
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_scenario_review.db"
os.environ["JWT_SECRET"] = "test-secret"

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

_DB = pathlib.Path(__file__).resolve().parent.parent / "test_scenario_review.db"


@pytest_asyncio.fixture
async def client():
    if _DB.exists():
        _DB.unlink()
    from app.database import engine, init_db
    from app.main import app
    from app.seed import seed

    await init_db()
    await seed()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    await engine.dispose()
    if _DB.exists():
        _DB.unlink()


async def login(client: AsyncClient, username: str) -> dict[str, str]:
    r = await client.post(
        "/api/auth/login", data={"username": username, "password": "Passw0rd!"}
    )
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
