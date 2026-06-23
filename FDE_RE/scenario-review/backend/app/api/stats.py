"""管理驾驶舱统计（§9.4 / §12）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.database import get_db
from app.models.deep_eval import DeepEvaluation
from app.models.enums import Role
from app.models.enums import ScenarioStatus as S
from app.models.poc import PocProject
from app.models.scenario import Scenario
from app.models.user import User
from app.schemas.phase2 import DashboardStats

router = APIRouter(prefix="/api/stats", tags=["stats"])

PASSED = {
    S.RECOMMEND_DEEP, S.DEEP_EVAL, S.PENDING_REVIEW, S.POC_SUGGEST,
    S.POC_RUNNING, S.POC_SUCCESS, S.POC_FAILED, S.PRODUCTIZING, S.PRODUCTIZED,
}


async def _compute(db: AsyncSession) -> DashboardStats:
    scs = (await db.execute(select(Scenario))).scalars().all()
    total = len(scs)

    by_status: dict[str, int] = {}
    by_industry: dict[str, int] = {}
    by_module: dict[str, int] = {}
    for s in scs:
        by_status[s.status] = by_status.get(s.status, 0) + 1
        for i in s.industry or []:
            by_industry[i] = by_industry.get(i, 0) + 1
        for m in s.sap_modules or []:
            by_module[m] = by_module.get(m, 0) + 1

    p0p1 = sum(1 for s in scs if s.latest_recommendation in ("P0", "P1"))
    submitted_total = sum(1 for s in scs if s.status != S.DRAFT)
    passed = sum(1 for s in scs if s.status in PASSED)
    screening_pass_rate = round(passed / submitted_total, 3) if submitted_total else 0.0

    pocs = (await db.execute(select(PocProject))).scalars().all()
    poc_count = len(pocs)
    poc_success = sum(1 for p in pocs if p.result == "success")
    poc_success_rate = round(poc_success / poc_count, 3) if poc_count else 0.0
    productized = sum(1 for s in scs if s.status == S.PRODUCTIZED)

    des = (await db.execute(select(DeepEvaluation))).scalars().all()
    total_annual_benefit = round(sum(d.annual_benefit or 0 for d in des), 2)
    roi_vals = [p.roi_multiple for p in pocs if p.roi_multiple] + [
        d.roi_multiple for d in des if d.roi_multiple
    ]
    avg_roi = round(sum(roi_vals) / len(roi_vals), 2) if roi_vals else None

    return DashboardStats(
        total=total,
        by_status=by_status,
        by_industry=by_industry,
        by_module=by_module,
        p0p1=p0p1,
        screening_pass_rate=screening_pass_rate,
        poc_count=poc_count,
        poc_success_rate=poc_success_rate,
        productized=productized,
        total_annual_benefit=total_annual_benefit,
        avg_roi_multiple=avg_roi,
    )


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(Role.MANAGER, Role.ADMIN, Role.SCREENER)),
) -> DashboardStats:
    return await _compute(db)


@router.get("/overview", response_model=DashboardStats)
async def overview(db: AsyncSession = Depends(get_db)) -> DashboardStats:
    """公开聚合概览（无敏感字段），供首页数字孪生大屏免登录展示。"""
    return await _compute(db)
