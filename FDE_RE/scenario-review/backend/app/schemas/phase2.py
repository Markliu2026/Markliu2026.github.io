"""二期/三期 Pydantic 模型：深评、评审会、POC、产品化、激励、统计。"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

M = {"from_attributes": True}


# ---------------- 用户 ----------------
class UserBrief(BaseModel):
    id: str
    username: str
    display_name: str
    roles: list[str]
    department: str | None = None
    model_config = M


# ---------------- 深度评估 ----------------
class DeepEvalUpdate(BaseModel):
    business_process: str | None = None
    data_diligence: str | None = None
    ai_capability_fit: str | None = None
    closed_loop: str | None = None
    risks: str | None = None
    resources: str | None = None
    productization_potential: str | None = None
    baseline: str | None = None
    labor_saving: float = 0
    business_improvement: float = 0
    risk_reduction: float = 0
    revenue_increase: float = 0
    poc_investment: float = 0
    productization_investment: float = 0
    ops_cost: float = 0


class DeepEvalOut(DeepEvalUpdate):
    id: str
    scenario_id: str
    annual_benefit: float | None = None
    total_investment: float | None = None
    roi_multiple: float | None = None
    payback_months: float | None = None
    model_config = M


class AssignOwnerRequest(BaseModel):
    owner_id: str


# ---------------- 评审会 ----------------
class MeetingCreate(BaseModel):
    title: str
    meeting_type: str = "deep"
    meeting_date: str | None = None
    attendees: str | None = None


class MeetingOut(MeetingCreate):
    id: str
    status: str
    notes: str | None = None
    created_at: datetime
    model_config = M


class ItemCreate(BaseModel):
    scenario_id: str
    presenter_id: str | None = None


class ItemOut(BaseModel):
    id: str
    meeting_id: str
    scenario_id: str
    presenter_id: str | None = None
    conclusion: str | None = None
    action_items: str | None = None
    model_config = M


class VoteCreate(BaseModel):
    vote: str  # pass/revise/hold/reject
    business_value_score: float | None = None
    feasibility_score: float | None = None
    replicability_score: float | None = None
    strategic_fit_score: float | None = None
    comment: str | None = None


class VoteOut(VoteCreate):
    id: str
    item_id: str
    voter_id: str
    created_at: datetime
    model_config = M


class VoteSummary(BaseModel):
    count: int
    avg_weighted: float | None = None
    max_weighted: float | None = None
    min_weighted: float | None = None
    divergence: float | None = None
    votes: dict[str, int]  # vote -> count


class ConcludeRequest(BaseModel):
    conclusion: str  # 目标场景状态：poc_suggest/observing/rejected/deep_eval
    action_items: str | None = None


# ---------------- POC ----------------
class PocUpdate(BaseModel):
    customer: str | None = None
    stage: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    baseline_locked: bool | None = None
    risk_level: str | None = None
    progress: str | None = None
    next_plan: str | None = None
    blockers: str | None = None
    need_mgmt: str | None = None


class PocOut(BaseModel):
    id: str
    scenario_id: str
    customer: str | None = None
    owner_id: str | None = None
    stage: str
    start_date: str | None = None
    end_date: str | None = None
    baseline_locked: bool
    risk_level: str
    result: str
    roi_multiple: float | None = None
    payback_months: float | None = None
    progress: str | None = None
    next_plan: str | None = None
    blockers: str | None = None
    need_mgmt: str | None = None
    model_config = M


class MilestoneCreate(BaseModel):
    name: str
    stage: str | None = None
    due_date: str | None = None


class MilestoneOut(MilestoneCreate):
    id: str
    poc_id: str
    done: bool
    model_config = M


class ValueMetricCreate(BaseModel):
    category: str = "business"
    name: str
    baseline: str | None = None
    target: str | None = None
    actual: str | None = None
    unit: str | None = None
    period: str | None = None
    source: str | None = None
    formula: str | None = None
    owner: str | None = None


class ValueMetricOut(ValueMetricCreate):
    id: str
    poc_id: str
    model_config = M


class PocFinishRequest(BaseModel):
    success: bool
    roi_multiple: float | None = None
    payback_months: float | None = None


# ---------------- 产品化资产 ----------------
class AssetCreate(BaseModel):
    asset_type: str
    title: str
    version: str = "v1.0"
    file_url: str | None = None
    reusable_level: str = "customer"


class AssetUpdate(BaseModel):
    status: str | None = None
    version: str | None = None
    file_url: str | None = None
    reusable_level: str | None = None


class AssetOut(AssetCreate):
    id: str
    scenario_id: str
    poc_id: str | None = None
    owner_id: str | None = None
    status: str
    created_at: datetime
    model_config = M


# ---------------- 激励 ----------------
class PointOut(BaseModel):
    id: str
    event: str
    points: int
    scenario_id: str | None = None
    note: str | None = None
    created_at: datetime
    model_config = M


class ContributionProfile(BaseModel):
    user_id: str
    display_name: str
    total_points: int
    submit_count: int
    p0p1_count: int
    poc_count: int
    poc_success_count: int
    productized_count: int


# ---------------- 驾驶舱 ----------------
class DashboardStats(BaseModel):
    total: int
    by_status: dict[str, int]
    by_industry: dict[str, int]
    by_module: dict[str, int]
    p0p1: int
    screening_pass_rate: float
    poc_count: int
    poc_success_rate: float
    productized: int
    total_annual_benefit: float
    avg_roi_multiple: float | None = None
