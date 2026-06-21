"""激励与贡献档案（§6.9）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.enums import ScenarioStatus as S
from app.models.incentive import PointRecord
from app.models.scenario import Scenario
from app.models.user import User
from app.schemas.phase2 import ContributionProfile, PointOut

router = APIRouter(prefix="/api/incentive", tags=["incentive"])

POC_STATES = {S.POC_RUNNING, S.POC_SUCCESS, S.POC_FAILED, S.PRODUCTIZING, S.PRODUCTIZED}
SUCCESS_STATES = {S.POC_SUCCESS, S.PRODUCTIZING, S.PRODUCTIZED}


async def _profile(db: AsyncSession, user: User) -> ContributionProfile:
    scs = (
        await db.execute(select(Scenario).where(Scenario.submitter_id == user.id))
    ).scalars().all()
    pts = (
        await db.execute(select(PointRecord).where(PointRecord.user_id == user.id))
    ).scalars().all()
    return ContributionProfile(
        user_id=user.id,
        display_name=user.display_name,
        total_points=sum(p.points for p in pts),
        submit_count=sum(1 for s in scs if s.status != S.DRAFT),
        p0p1_count=sum(1 for s in scs if s.latest_recommendation in ("P0", "P1")),
        poc_count=sum(1 for s in scs if s.status in POC_STATES),
        poc_success_count=sum(1 for s in scs if s.status in SUCCESS_STATES),
        productized_count=sum(1 for s in scs if s.status == S.PRODUCTIZED),
    )


@router.get("/my", response_model=list[PointOut])
async def my_points(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[PointRecord]:
    res = await db.execute(
        select(PointRecord)
        .where(PointRecord.user_id == user.id)
        .order_by(PointRecord.created_at.desc())
    )
    return list(res.scalars().all())


@router.get("/profile", response_model=ContributionProfile)
async def my_profile(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ContributionProfile:
    return await _profile(db, user)


@router.get("/leaderboard", response_model=list[ContributionProfile])
async def leaderboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ContributionProfile]:
    users = (await db.execute(select(User).where(User.is_active.is_(True)))).scalars().all()
    profiles = [await _profile(db, u) for u in users]
    profiles = [p for p in profiles if p.total_points > 0 or p.submit_count > 0]
    profiles.sort(key=lambda p: p.total_points, reverse=True)
    return profiles
