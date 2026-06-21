from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ScoreType


class ScoreCreate(BaseModel):
    business_value_score: float = Field(..., ge=1, le=5)
    feasibility_score: float = Field(..., ge=1, le=5)
    replicability_score: float = Field(..., ge=1, le=5)
    strategic_fit_score: float = Field(..., ge=1, le=5)
    veto_flags: list[str] = []
    comment: str | None = None
    score_type: ScoreType = ScoreType.SCREENING


class ScoreOut(BaseModel):
    id: str
    scenario_id: str
    reviewer_id: str
    score_type: str
    business_value_score: float
    feasibility_score: float
    replicability_score: float
    strategic_fit_score: float
    weighted_score: float
    recommendation: str
    veto_flags: list[str]
    comment: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: str
    event: str
    title: str
    body: str | None = None
    scenario_id: str | None = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
