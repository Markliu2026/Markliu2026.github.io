"""种子数据：各角色用户 + 示例场景。

运行： uv run python -m app.seed
"""
from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.database import SessionLocal, init_db
from app.models.enums import Role, ScenarioStatus, WillingnessToPay
from app.models.scenario import Scenario
from app.models.user import User
from app.security import hash_password

USERS = [
    ("consultant", "顾问·张工", [Role.SUBMITTER], "离散制造事业部"),
    ("owner", "Owner·李工", [Role.OWNER, Role.SUBMITTER], "流程制造事业部"),
    ("screener", "初筛人·王经理", [Role.SCREENER], "数智工程师创新中心"),
    ("reviewer", "评委·赵专家", [Role.REVIEWER], "评审委员会"),
    ("airep", "AI研发·钱工", [Role.AI_REP], "AI研发团队"),
    ("manager", "管理层·孙总", [Role.MANAGER], "创新中心"),
    ("admin", "系统管理员", [Role.ADMIN], "IT"),
]

DEFAULT_PASSWORD = "Passw0rd!"


async def seed() -> None:
    await init_db()
    async with SessionLocal() as db:
        existing = (await db.execute(select(User))).scalars().first()
        if existing:
            print("已存在数据，跳过种子。")
            return

        users: dict[str, User] = {}
        for username, name, roles, dept in USERS:
            u = User(
                username=username,
                display_name=name,
                email=f"{username}@example.com",
                hashed_password=hash_password(DEFAULT_PASSWORD),
                roles=[str(r) for r in roles],
                department=dept,
            )
            db.add(u)
            users[username] = u
        await db.flush()

        # 示例场景：一份草稿 + 一份已提交
        demo1 = Scenario(
            title="需求预测数智工程师",
            status=ScenarioStatus.SUBMITTED,
            industry=["离散制造"],
            sap_modules=["PP", "MM"],
            process_domain=["Plan-to-Produce"],
            ai_capabilities=["预测"],
            customer_name="某汽车零部件客户",
            pain_point="需求波动大，计划员凭经验预测，缺货与呆滞并存",
            human_process="计划员每周手工汇总历史出货+销售口头预测做调整",
            frequency="每周",
            volume="约2000个SKU",
            kpi_candidates=["库存周转", "OTD"],
            data_basis="SAP出货历史可得，销售预测在Excel",
            willingness_to_pay=WillingnessToPay.MEDIUM,
            estimated_value="库存降低15%",
            submitter_id=users["consultant"].id,
        )
        demo2 = Scenario(
            title="月结异常自动稽核数智工程师",
            status=ScenarioStatus.DRAFT,
            industry=["流程制造"],
            sap_modules=["FICO"],
            process_domain=["Record-to-Report"],
            ai_capabilities=["异常识别"],
            pain_point="月结期间凭证异常靠人工逐笔排查，耗时且易漏",
            human_process="财务在月结日加班逐笔核对",
            frequency="月度",
            volume="数千张凭证",
            kpi_candidates=["月结天数"],
            data_basis="凭证数据在SAP可得",
            willingness_to_pay=WillingnessToPay.STRONG,
            submitter_id=users["owner"].id,
        )
        db.add_all([demo1, demo2])
        await db.commit()
        print("种子数据写入完成。")
        print(f"默认密码：{DEFAULT_PASSWORD}")
        print("账号：", ", ".join(u[0] for u in USERS))


if __name__ == "__main__":
    asyncio.run(seed())
