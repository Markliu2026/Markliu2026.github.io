from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import Confidentiality, WillingnessToPay


class ScenarioBase(BaseModel):
    title: str = Field(..., max_length=256)
    industry: list[str] = []
    sap_modules: list[str] = []
    process_domain: list[str] = []
    ai_capabilities: list[str] = []
    customer_name: str | None = None
    pain_point: str | None = None
    human_process: str | None = None
    frequency: str | None = None
    volume: str | None = None
    kpi_candidates: list[str] = []
    data_basis: str | None = None
    willingness_to_pay: WillingnessToPay = WillingnessToPay.UNKNOWN
    estimated_value: str | None = None
    confidentiality_level: Confidentiality = Confidentiality.INTERNAL


class ScenarioCreate(ScenarioBase):
    pass


class ScenarioUpdate(BaseModel):
    """草稿/待补充阶段的部分更新。"""

    title: str | None = None
    industry: list[str] | None = None
    sap_modules: list[str] | None = None
    process_domain: list[str] | None = None
    ai_capabilities: list[str] | None = None
    customer_name: str | None = None
    pain_point: str | None = None
    human_process: str | None = None
    frequency: str | None = None
    volume: str | None = None
    kpi_candidates: list[str] | None = None
    data_basis: str | None = None
    willingness_to_pay: WillingnessToPay | None = None
    estimated_value: str | None = None
    confidentiality_level: Confidentiality | None = None


class ScenarioOut(ScenarioBase):
    id: str
    status: str
    submitter_id: str
    owner_id: str | None = None
    latest_weighted_score: float | None = None
    latest_recommendation: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StatusChangeRequest(BaseModel):
    target_status: str
    comment: str | None = None


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: str
    scenario_id: str
    author_id: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AttachmentCreate(BaseModel):
    filename: str
    file_url: str
    confidentiality_level: Confidentiality = Confidentiality.INTERNAL


class AttachmentOut(BaseModel):
    id: str
    scenario_id: str
    uploader_id: str
    filename: str
    file_url: str
    confidentiality_level: str
    created_at: datetime

    model_config = {"from_attributes": True}
