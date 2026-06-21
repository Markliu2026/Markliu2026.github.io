"""场景提报与初筛路由（§6.1 / §6.3 / §5 / §9）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.database import get_db
from app.models.enums import Role, ScenarioStatus
from app.models.scenario import Scenario, ScenarioAttachment, ScenarioComment
from app.models.user import User
from app.schemas.scenario import (
    AttachmentCreate,
    AttachmentOut,
    CommentCreate,
    CommentOut,
    ScenarioCreate,
    ScenarioOut,
    ScenarioUpdate,
    StatusChangeRequest,
)
from app.services import incentive, state_machine
from app.services.notification import notify

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

# 公开场景库可见的状态（§9.1 场景库 / §11.1 公开）
LIBRARY_STATUSES = {ScenarioStatus.RECOMMEND_DEEP, ScenarioStatus.OBSERVING}
EDITABLE_STATUSES = {ScenarioStatus.DRAFT, ScenarioStatus.NEED_INFO}


async def _users_with_role(db: AsyncSession, role: str) -> list[User]:
    res = await db.execute(select(User).where(User.is_active.is_(True)))
    return [u for u in res.scalars().all() if role in (u.roles or [])]


async def _get_owned_scenario(db: AsyncSession, scenario_id: str, user: User) -> Scenario:
    sc = await db.get(Scenario, scenario_id)
    if not sc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "场景不存在")
    return sc


# ---------------------------------------------------------------- 提报（提报人）

@router.post("", response_model=ScenarioOut, status_code=status.HTTP_201_CREATED)
async def create_scenario(
    payload: ScenarioCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Scenario:
    sc = Scenario(
        **payload.model_dump(),
        status=ScenarioStatus.DRAFT,
        submitter_id=user.id,
        tenant_id=user.tenant_id,
    )
    db.add(sc)
    await db.commit()
    await db.refresh(sc)
    return sc


@router.get("/mine", response_model=list[ScenarioOut])
async def my_scenarios(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Scenario]:
    res = await db.execute(
        select(Scenario)
        .where(Scenario.submitter_id == user.id)
        .order_by(Scenario.updated_at.desc())
    )
    return list(res.scalars().all())


@router.get("/library", response_model=list[ScenarioOut])
async def library(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Scenario]:
    """公开场景库列表（§9.1）。"""
    res = await db.execute(
        select(Scenario)
        .where(Scenario.status.in_(LIBRARY_STATUSES))
        .order_by(Scenario.latest_weighted_score.desc().nullslast())
    )
    return list(res.scalars().all())


@router.get("/screening-queue", response_model=list[ScenarioOut])
async def screening_queue(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SCREENER, Role.ADMIN)),
) -> list[Scenario]:
    """初筛队列：已提交 + 初筛中（§9.2）。"""
    res = await db.execute(
        select(Scenario)
        .where(Scenario.status.in_([ScenarioStatus.SUBMITTED, ScenarioStatus.SCREENING]))
        .order_by(Scenario.created_at.asc())
    )
    return list(res.scalars().all())


@router.get("/review-queue", response_model=list[ScenarioOut])
async def review_queue(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(
        require_roles(Role.REVIEWER, Role.MANAGER, Role.SCREENER, Role.ADMIN)
    ),
) -> list[Scenario]:
    """待评审会队列（pending_review，§6.5）。"""
    res = await db.execute(
        select(Scenario)
        .where(Scenario.status == ScenarioStatus.PENDING_REVIEW)
        .order_by(Scenario.created_at.asc())
    )
    return list(res.scalars().all())


@router.get("/{scenario_id}", response_model=ScenarioOut)
async def get_scenario(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Scenario:
    return await _get_owned_scenario(db, scenario_id, user)


@router.patch("/{scenario_id}", response_model=ScenarioOut)
async def update_scenario(
    scenario_id: str,
    payload: ScenarioUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Scenario:
    sc = await _get_owned_scenario(db, scenario_id, user)
    if sc.submitter_id != user.id and Role.ADMIN not in user.roles:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "仅提报人可编辑")
    if sc.status not in EDITABLE_STATUSES:
        raise HTTPException(status.HTTP_409_CONFLICT, "当前状态不可编辑（仅草稿/待补充可编辑）")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(sc, k, v)
    await db.commit()
    await db.refresh(sc)
    return sc


@router.post("/{scenario_id}/submit", response_model=ScenarioOut)
async def submit_scenario(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Scenario:
    sc = await _get_owned_scenario(db, scenario_id, user)
    if sc.submitter_id != user.id and Role.ADMIN not in user.roles:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "仅提报人可提交")
    # 完整性校验（§8.1 / §6.1）
    missing = [
        f
        for f in ("title", "pain_point", "human_process", "data_basis")
        if not getattr(sc, f)
    ]
    if not sc.industry or not sc.sap_modules or not sc.kpi_candidates:
        missing.append("industry/sap_modules/kpi_candidates")
    if missing:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"缺少必填字段：{missing}")

    state_machine.assert_transition(sc.status, ScenarioStatus.SUBMITTED, user.roles)
    sc.status = ScenarioStatus.SUBMITTED
    # 有效提报积分（§6.9.1，幂等）
    await incentive.award(
        db, user_id=sc.submitter_id, event="valid_submit", scenario_id=sc.id, tenant_id=sc.tenant_id
    )
    # 通知创新中心初筛人（§10）
    for screener in await _users_with_role(db, Role.SCREENER):
        await notify(
            db,
            recipient_id=screener.id,
            event="scenario_submitted",
            title=f"新场景待初筛：{sc.title}",
            scenario_id=sc.id,
            tenant_id=sc.tenant_id,
        )
    await db.commit()
    await db.refresh(sc)
    return sc


@router.post("/{scenario_id}/transition", response_model=ScenarioOut)
async def transition(
    scenario_id: str,
    payload: StatusChangeRequest,
    db: AsyncSession = Depends(get_db),
    # 端点放开到任意登录用户，由状态机按 from→to 校验具体角色（§5.2/§19.2 单一权威）
    user: User = Depends(get_current_user),
) -> Scenario:
    sc = await _get_owned_scenario(db, scenario_id, user)
    try:
        state_machine.assert_transition(sc.status, payload.target_status, user.roles)
    except state_machine.TransitionError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from e
    sc.status = payload.target_status
    await incentive.award_for_status(db, sc)  # 触发对应阶段积分（§6.9.1）
    if payload.comment:
        db.add(
            ScenarioComment(
                scenario_id=sc.id,
                author_id=user.id,
                content=payload.comment,
                tenant_id=sc.tenant_id,
            )
        )
    # 退回补充通知提报人（§10）
    if payload.target_status == ScenarioStatus.NEED_INFO:
        await notify(
            db,
            recipient_id=sc.submitter_id,
            event="need_info",
            title=f"场景需补充：{sc.title}",
            body=payload.comment,
            scenario_id=sc.id,
            tenant_id=sc.tenant_id,
        )
    await db.commit()
    await db.refresh(sc)
    return sc


# ---------------------------------------------------------------- 评论

@router.get("/{scenario_id}/comments", response_model=list[CommentOut])
async def list_comments(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ScenarioComment]:
    res = await db.execute(
        select(ScenarioComment)
        .where(ScenarioComment.scenario_id == scenario_id)
        .order_by(ScenarioComment.created_at.asc())
    )
    return list(res.scalars().all())


@router.post("/{scenario_id}/comments", response_model=CommentOut, status_code=201)
async def add_comment(
    scenario_id: str,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ScenarioComment:
    sc = await _get_owned_scenario(db, scenario_id, user)
    c = ScenarioComment(
        scenario_id=sc.id, author_id=user.id, content=payload.content, tenant_id=sc.tenant_id
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return c


# ---------------------------------------------------------------- 附件（仅登记链接，§11.2）

@router.get("/{scenario_id}/attachments", response_model=list[AttachmentOut])
async def list_attachments(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ScenarioAttachment]:
    res = await db.execute(
        select(ScenarioAttachment)
        .where(ScenarioAttachment.scenario_id == scenario_id)
        .order_by(ScenarioAttachment.created_at.asc())
    )
    return list(res.scalars().all())


@router.post("/{scenario_id}/attachments", response_model=AttachmentOut, status_code=201)
async def add_attachment(
    scenario_id: str,
    payload: AttachmentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ScenarioAttachment:
    sc = await _get_owned_scenario(db, scenario_id, user)
    a = ScenarioAttachment(
        scenario_id=sc.id,
        uploader_id=user.id,
        filename=payload.filename,
        file_url=payload.file_url,
        confidentiality_level=payload.confidentiality_level,
        tenant_id=sc.tenant_id,
    )
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return a
