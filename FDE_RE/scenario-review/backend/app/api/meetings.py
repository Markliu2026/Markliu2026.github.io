"""评审会：会议、议题、投票、结论（§6.5）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.database import get_db
from app.models.enums import Role
from app.models.meeting import MeetingVote, ReviewItem, ReviewMeeting
from app.models.scenario import Scenario
from app.models.user import User
from app.schemas.phase2 import (
    ConcludeRequest,
    ItemCreate,
    ItemOut,
    MeetingCreate,
    MeetingOut,
    VoteCreate,
    VoteOut,
    VoteSummary,
)
from app.services import incentive, scoring, state_machine
from app.services.notification import notify

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

REVIEW_ROLES = (Role.REVIEWER, Role.MANAGER, Role.ADMIN)


@router.get("", response_model=list[MeetingOut])
async def list_meetings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*REVIEW_ROLES, Role.SCREENER)),
) -> list[ReviewMeeting]:
    res = await db.execute(select(ReviewMeeting).order_by(ReviewMeeting.created_at.desc()))
    return list(res.scalars().all())


@router.post("", response_model=MeetingOut, status_code=201)
async def create_meeting(
    payload: MeetingCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(Role.SCREENER, Role.ADMIN, Role.MANAGER)),
) -> ReviewMeeting:
    m = ReviewMeeting(**payload.model_dump())
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


@router.get("/{meeting_id}/items", response_model=list[ItemOut])
async def list_items(
    meeting_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*REVIEW_ROLES, Role.SCREENER)),
) -> list[ReviewItem]:
    res = await db.execute(select(ReviewItem).where(ReviewItem.meeting_id == meeting_id))
    return list(res.scalars().all())


@router.post("/{meeting_id}/items", response_model=ItemOut, status_code=201)
async def add_item(
    meeting_id: str,
    payload: ItemCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(Role.SCREENER, Role.ADMIN, Role.MANAGER)),
) -> ReviewItem:
    m = await db.get(ReviewMeeting, meeting_id)
    if not m:
        raise HTTPException(404, "评审会不存在")
    sc = await db.get(Scenario, payload.scenario_id)
    if not sc:
        raise HTTPException(404, "场景不存在")
    item = ReviewItem(
        meeting_id=meeting_id,
        scenario_id=payload.scenario_id,
        presenter_id=payload.presenter_id or sc.owner_id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/items/{item_id}/votes", response_model=VoteOut, status_code=201)
async def cast_vote(
    item_id: str,
    payload: VoteCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(*REVIEW_ROLES)),
) -> MeetingVote:
    item = await db.get(ReviewItem, item_id)
    if not item:
        raise HTTPException(404, "议题不存在")
    v = MeetingVote(item_id=item_id, voter_id=user.id, **payload.model_dump())
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return v


@router.get("/items/{item_id}/votes", response_model=VoteSummary)
async def vote_summary(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*REVIEW_ROLES, Role.SCREENER)),
) -> VoteSummary:
    votes = (
        await db.execute(select(MeetingVote).where(MeetingVote.item_id == item_id))
    ).scalars().all()
    weighted = [
        scoring.compute_weighted_score(
            v.business_value_score or 0,
            v.feasibility_score or 0,
            v.replicability_score or 0,
            v.strategic_fit_score or 0,
        )
        for v in votes
        if v.business_value_score is not None
    ]
    tally: dict[str, int] = {}
    for v in votes:
        tally[v.vote] = tally.get(v.vote, 0) + 1
    avg = round(sum(weighted) / len(weighted), 2) if weighted else None
    return VoteSummary(
        count=len(votes),
        avg_weighted=avg,
        max_weighted=max(weighted) if weighted else None,
        min_weighted=min(weighted) if weighted else None,
        divergence=round(max(weighted) - min(weighted), 2) if weighted else None,
        votes=tally,
    )


@router.post("/items/{item_id}/conclude", response_model=ItemOut)
async def conclude(
    item_id: str,
    payload: ConcludeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(*REVIEW_ROLES)),
) -> ReviewItem:
    item = await db.get(ReviewItem, item_id)
    if not item:
        raise HTTPException(404, "议题不存在")
    sc = await db.get(Scenario, item.scenario_id)
    if not sc:
        raise HTTPException(404, "场景不存在")
    try:
        state_machine.assert_transition(sc.status, payload.conclusion, user.roles)
    except state_machine.TransitionError as e:
        raise HTTPException(409, str(e)) from e
    sc.status = payload.conclusion
    item.conclusion = payload.conclusion
    item.action_items = payload.action_items
    await incentive.award_for_status(db, sc)
    await notify(
        db,
        recipient_id=sc.submitter_id,
        event="meeting_conclusion",
        title=f"评审会结论：{sc.title} → {payload.conclusion}",
        body=payload.action_items,
        scenario_id=sc.id,
        tenant_id=sc.tenant_id,
    )
    await db.commit()
    await db.refresh(item)
    return item
