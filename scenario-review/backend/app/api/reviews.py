"""初筛四维评分路由（§6.3）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.database import get_db
from app.models.enums import Role, ScenarioStatus
from app.models.review import ReviewScore
from app.models.scenario import Scenario
from app.models.user import User
from app.schemas.review import ScoreCreate, ScoreOut
from app.services import scoring
from app.services.notification import notify

router = APIRouter(prefix="/api/scenarios", tags=["reviews"])

SCORABLE_STATUSES = {ScenarioStatus.SUBMITTED, ScenarioStatus.SCREENING}


@router.post("/{scenario_id}/scores", response_model=ScoreOut, status_code=201)
async def create_score(
    scenario_id: str,
    payload: ScoreCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SCREENER, Role.ADMIN)),
) -> ReviewScore:
    sc = await db.get(Scenario, scenario_id)
    if not sc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "场景不存在")
    if sc.status not in SCORABLE_STATUSES:
        raise HTTPException(status.HTTP_409_CONFLICT, "当前状态不可初筛评分")

    veto = scoring.validate_veto_flags(payload.veto_flags)
    result = scoring.compute(
        payload.business_value_score,
        payload.feasibility_score,
        payload.replicability_score,
        payload.strategic_fit_score,
        veto_flags=veto,
    )
    score = ReviewScore(
        scenario_id=sc.id,
        reviewer_id=user.id,
        score_type=payload.score_type,
        business_value_score=payload.business_value_score,
        feasibility_score=payload.feasibility_score,
        replicability_score=payload.replicability_score,
        strategic_fit_score=payload.strategic_fit_score,
        weighted_score=result.weighted_score,
        recommendation=result.recommendation,
        veto_flags=veto,
        comment=payload.comment,
        tenant_id=sc.tenant_id,
    )
    db.add(score)

    # 评分进入初筛中 + 回写最新结论快照
    if sc.status == ScenarioStatus.SUBMITTED:
        sc.status = ScenarioStatus.SCREENING
    sc.latest_weighted_score = result.weighted_score
    sc.latest_recommendation = result.recommendation

    # 反馈提报人（§10）
    await notify(
        db,
        recipient_id=sc.submitter_id,
        event="screening_scored",
        title=f"场景已初筛评分：{sc.title}（{result.recommendation} / {result.weighted_score}）",
        body=payload.comment,
        scenario_id=sc.id,
        tenant_id=sc.tenant_id,
    )
    await db.commit()
    await db.refresh(score)
    return score


@router.get("/{scenario_id}/scores", response_model=list[ScoreOut])
async def list_scores(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.SCREENER, Role.REVIEWER, Role.ADMIN, Role.AI_REP)),
) -> list[ReviewScore]:
    res = await db.execute(
        select(ReviewScore)
        .where(ReviewScore.scenario_id == scenario_id)
        .order_by(ReviewScore.created_at.desc())
    )
    return list(res.scalars().all())
