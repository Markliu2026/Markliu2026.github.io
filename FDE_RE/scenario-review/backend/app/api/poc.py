"""POC 管理：立项、看板、里程碑、价值指标、结项（§6.6 / §6.7）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.database import get_db
from app.models.enums import Role, ScenarioStatus
from app.models.poc import Milestone, PocProject, ValueMetric
from app.models.scenario import Scenario
from app.models.user import User
from app.schemas.phase2 import (
    MilestoneCreate,
    MilestoneOut,
    PocFinishRequest,
    PocOut,
    PocUpdate,
    ValueMetricCreate,
    ValueMetricOut,
)
from app.services import incentive, state_machine
from app.services.notification import notify

router = APIRouter(prefix="/api/poc", tags=["poc"])


@router.post("/from-scenario/{scenario_id}", response_model=PocOut, status_code=201)
async def kickoff(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.MANAGER, Role.ADMIN)),
) -> PocProject:
    """POC 立项：场景 poc_suggest → poc_running，并创建 POC 项目，锁定 baseline。"""
    sc = await db.get(Scenario, scenario_id)
    if not sc:
        raise HTTPException(404, "场景不存在")
    try:
        state_machine.assert_transition(sc.status, ScenarioStatus.POC_RUNNING, user.roles)
    except state_machine.TransitionError as e:
        raise HTTPException(409, str(e)) from e
    existing = (
        await db.execute(select(PocProject).where(PocProject.scenario_id == scenario_id))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "该场景已有 POC 项目")
    sc.status = ScenarioStatus.POC_RUNNING
    poc = PocProject(
        scenario_id=scenario_id,
        customer=sc.customer_name,
        owner_id=sc.owner_id,
        stage="kickoff",
        baseline_locked=True,
        result="running",
        tenant_id=sc.tenant_id,
    )
    db.add(poc)
    await incentive.award_for_status(db, sc)
    if sc.owner_id:
        await notify(
            db,
            recipient_id=sc.owner_id,
            event="poc_kickoff",
            title=f"POC 已立项：{sc.title}",
            scenario_id=sc.id,
            tenant_id=sc.tenant_id,
        )
    await db.commit()
    await db.refresh(poc)
    return poc


@router.get("", response_model=list[PocOut])
async def list_poc(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[PocProject]:
    res = await db.execute(select(PocProject).order_by(PocProject.created_at.desc()))
    return list(res.scalars().all())


@router.get("/{poc_id}", response_model=PocOut)
async def get_poc(
    poc_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PocProject:
    poc = await db.get(PocProject, poc_id)
    if not poc:
        raise HTTPException(404, "POC 不存在")
    return poc


@router.put("/{poc_id}", response_model=PocOut)
async def update_poc(
    poc_id: str,
    payload: PocUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(Role.OWNER, Role.SCREENER, Role.ADMIN, Role.MANAGER)),
) -> PocProject:
    poc = await db.get(PocProject, poc_id)
    if not poc:
        raise HTTPException(404, "POC 不存在")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(poc, k, v)
    await db.commit()
    await db.refresh(poc)
    return poc


@router.post("/{poc_id}/milestones", response_model=MilestoneOut, status_code=201)
async def add_milestone(
    poc_id: str,
    payload: MilestoneCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(Role.OWNER, Role.SCREENER, Role.ADMIN)),
) -> Milestone:
    poc = await db.get(PocProject, poc_id)
    if not poc:
        raise HTTPException(404, "POC 不存在")
    m = Milestone(poc_id=poc_id, tenant_id=poc.tenant_id, **payload.model_dump())
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


@router.get("/{poc_id}/milestones", response_model=list[MilestoneOut])
async def list_milestones(
    poc_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Milestone]:
    res = await db.execute(
        select(Milestone).where(Milestone.poc_id == poc_id).order_by(Milestone.created_at.asc())
    )
    return list(res.scalars().all())


@router.put("/milestones/{milestone_id}/toggle", response_model=MilestoneOut)
async def toggle_milestone(
    milestone_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(Role.OWNER, Role.SCREENER, Role.ADMIN)),
) -> Milestone:
    m = await db.get(Milestone, milestone_id)
    if not m:
        raise HTTPException(404, "里程碑不存在")
    m.done = not m.done
    await db.commit()
    await db.refresh(m)
    return m


@router.post("/{poc_id}/metrics", response_model=ValueMetricOut, status_code=201)
async def add_metric(
    poc_id: str,
    payload: ValueMetricCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(Role.OWNER, Role.SCREENER, Role.ADMIN)),
) -> ValueMetric:
    poc = await db.get(PocProject, poc_id)
    if not poc:
        raise HTTPException(404, "POC 不存在")
    vm = ValueMetric(poc_id=poc_id, tenant_id=poc.tenant_id, **payload.model_dump())
    db.add(vm)
    await db.commit()
    await db.refresh(vm)
    return vm


@router.get("/{poc_id}/metrics", response_model=list[ValueMetricOut])
async def list_metrics(
    poc_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ValueMetric]:
    res = await db.execute(select(ValueMetric).where(ValueMetric.poc_id == poc_id))
    return list(res.scalars().all())


@router.post("/{poc_id}/finish", response_model=PocOut)
async def finish_poc(
    poc_id: str,
    payload: PocFinishRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.OWNER, Role.SCREENER, Role.ADMIN)),
) -> PocProject:
    poc = await db.get(PocProject, poc_id)
    if not poc:
        raise HTTPException(404, "POC 不存在")
    sc = await db.get(Scenario, poc.scenario_id)
    target = ScenarioStatus.POC_SUCCESS if payload.success else ScenarioStatus.POC_FAILED
    try:
        state_machine.assert_transition(sc.status, target, user.roles)
    except state_machine.TransitionError as e:
        raise HTTPException(409, str(e)) from e
    sc.status = target
    poc.result = "success" if payload.success else "failed"
    poc.stage = "done"
    poc.roi_multiple = payload.roi_multiple
    poc.payback_months = payload.payback_months
    await incentive.award_for_status(db, sc)
    await notify(
        db,
        recipient_id=sc.submitter_id,
        event="poc_result",
        title=f"POC {'成功' if payload.success else '未通过'}：{sc.title}",
        scenario_id=sc.id,
        tenant_id=sc.tenant_id,
    )
    await db.commit()
    await db.refresh(poc)
    return poc
