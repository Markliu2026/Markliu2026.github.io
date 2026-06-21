"""深度评估：指定 Owner、深评材料 CRUD、ROI 测算、提交评审会（§6.4）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.database import get_db
from app.models.deep_eval import DeepEvaluation
from app.models.enums import Role, ScenarioStatus
from app.models.scenario import Scenario
from app.models.user import User
from app.schemas.phase2 import AssignOwnerRequest, DeepEvalOut, DeepEvalUpdate
from app.services import incentive, state_machine
from app.services.notification import notify
from app.services.roi import compute_roi

router = APIRouter(prefix="/api/scenarios", tags=["deep-eval"])


async def _get_or_create_eval(db: AsyncSession, scenario_id: str) -> DeepEvaluation:
    de = (
        await db.execute(select(DeepEvaluation).where(DeepEvaluation.scenario_id == scenario_id))
    ).scalar_one_or_none()
    if not de:
        de = DeepEvaluation(scenario_id=scenario_id)
        db.add(de)
        await db.flush()
    return de


@router.post("/{scenario_id}/assign-owner", response_model=DeepEvalOut)
async def assign_owner(
    scenario_id: str,
    payload: AssignOwnerRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SCREENER, Role.ADMIN)),
) -> DeepEvaluation:
    sc = await db.get(Scenario, scenario_id)
    if not sc:
        raise HTTPException(404, "场景不存在")
    owner = await db.get(User, payload.owner_id)
    if not owner:
        raise HTTPException(404, "指定的 Owner 不存在")
    try:
        state_machine.assert_transition(sc.status, ScenarioStatus.DEEP_EVAL, user.roles)
    except state_machine.TransitionError as e:
        raise HTTPException(409, str(e)) from e
    sc.owner_id = owner.id
    sc.status = ScenarioStatus.DEEP_EVAL
    de = await _get_or_create_eval(db, scenario_id)
    await notify(
        db,
        recipient_id=owner.id,
        event="assigned_owner",
        title=f"你被指定为场景 Owner：{sc.title}",
        scenario_id=sc.id,
        tenant_id=sc.tenant_id,
    )
    await db.commit()
    await db.refresh(de)
    return de


@router.get("/{scenario_id}/deep-eval", response_model=DeepEvalOut)
async def get_deep_eval(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DeepEvaluation:
    de = await _get_or_create_eval(db, scenario_id)
    await db.commit()
    await db.refresh(de)
    return de


@router.put("/{scenario_id}/deep-eval", response_model=DeepEvalOut)
async def update_deep_eval(
    scenario_id: str,
    payload: DeepEvalUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.OWNER, Role.ADMIN, Role.AI_REP)),
) -> DeepEvaluation:
    sc = await db.get(Scenario, scenario_id)
    if not sc:
        raise HTTPException(404, "场景不存在")
    de = await _get_or_create_eval(db, scenario_id)
    for k, v in payload.model_dump().items():
        setattr(de, k, v)
    roi = compute_roi(
        labor_saving=de.labor_saving,
        business_improvement=de.business_improvement,
        risk_reduction=de.risk_reduction,
        revenue_increase=de.revenue_increase,
        poc_investment=de.poc_investment,
        productization_investment=de.productization_investment,
        ops_cost=de.ops_cost,
    )
    de.annual_benefit = roi.annual_benefit
    de.total_investment = roi.total_investment
    de.roi_multiple = roi.roi_multiple
    de.payback_months = roi.payback_months
    await db.commit()
    await db.refresh(de)
    return de


@router.post("/{scenario_id}/submit-review", response_model=DeepEvalOut)
async def submit_to_review(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.OWNER, Role.ADMIN)),
) -> DeepEvaluation:
    sc = await db.get(Scenario, scenario_id)
    if not sc:
        raise HTTPException(404, "场景不存在")
    try:
        state_machine.assert_transition(sc.status, ScenarioStatus.PENDING_REVIEW, user.roles)
    except state_machine.TransitionError as e:
        raise HTTPException(409, str(e)) from e
    sc.status = ScenarioStatus.PENDING_REVIEW
    await incentive.award_for_status(db, sc)
    # 通知评委
    for r in (await db.execute(select(User).where(User.is_active.is_(True)))).scalars().all():
        if Role.REVIEWER in (r.roles or []):
            await notify(
                db,
                recipient_id=r.id,
                event="pending_review",
                title=f"场景待评审会：{sc.title}",
                scenario_id=sc.id,
                tenant_id=sc.tenant_id,
            )
    de = await _get_or_create_eval(db, scenario_id)
    await db.commit()
    await db.refresh(de)
    return de
