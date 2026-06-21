"""激励积分服务（§6.9.1 积分规则）。"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.incentive import PointRecord

# 事件 -> 积分（§6.9.1）
POINTS: dict[str, int] = {
    "valid_submit": 10,       # 有效提报
    "pass_screening": 30,     # 通过初筛（P1+）
    "poc_suggest": 80,        # 进入POC建议
    "poc_kickoff": 120,       # POC立项
    "poc_success": 300,       # POC成功
    "productized": 500,       # 产品化成功
    "reuse_case": 100,        # 提供复用案例
}

EVENT_LABELS: dict[str, str] = {
    "valid_submit": "有效提报",
    "pass_screening": "通过初筛",
    "poc_suggest": "进入POC建议",
    "poc_kickoff": "POC立项",
    "poc_success": "POC成功",
    "productized": "产品化成功",
    "reuse_case": "提供复用案例",
}


async def award(
    db: AsyncSession,
    *,
    user_id: str,
    event: str,
    scenario_id: str | None = None,
    tenant_id: str | None = None,
) -> PointRecord | None:
    """按事件给用户加分。同一 (user, event, scenario) 幂等，避免重复发放。"""
    if event not in POINTS:
        return None
    q = select(PointRecord).where(
        PointRecord.user_id == user_id,
        PointRecord.event == event,
    )
    if scenario_id is not None:
        q = q.where(PointRecord.scenario_id == scenario_id)
    if (await db.execute(q)).scalars().first():
        return None
    rec = PointRecord(
        user_id=user_id,
        scenario_id=scenario_id,
        event=event,
        points=POINTS[event],
        note=EVENT_LABELS.get(event),
    )
    if tenant_id:
        rec.tenant_id = tenant_id
    db.add(rec)
    await db.flush()
    return rec


# 场景状态 -> 触发的积分事件（发放给提报人）
STATUS_EVENT: dict[str, str] = {
    "recommend_deep": "pass_screening",
    "poc_suggest": "poc_suggest",
    "poc_running": "poc_kickoff",
    "poc_success": "poc_success",
    "productized": "productized",
}


async def award_for_status(db: AsyncSession, scenario) -> None:
    """场景进入某状态时，给提报人发放对应积分（幂等）。"""
    event = STATUS_EVENT.get(scenario.status)
    if event:
        await award(
            db,
            user_id=scenario.submitter_id,
            event=event,
            scenario_id=scenario.id,
            tenant_id=scenario.tenant_id,
        )


async def total_points(db: AsyncSession, user_id: str) -> int:
    recs = (
        await db.execute(select(PointRecord).where(PointRecord.user_id == user_id))
    ).scalars().all()
    return sum(r.points for r in recs)
