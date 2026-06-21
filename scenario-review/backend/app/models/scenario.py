"""场景主对象 + 评论 + 附件（§6.1 / §7.2）。"""
from __future__ import annotations

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantTimestampMixin
from app.models.enums import Confidentiality, ScenarioStatus, WillingnessToPay


class Scenario(TenantTimestampMixin, Base):
    __tablename__ = "biz_scenario"

    title: Mapped[str] = mapped_column(String(256))
    status: Mapped[str] = mapped_column(String(32), default=ScenarioStatus.DRAFT, index=True)

    # 轻量提报字段（§6.1.2）
    industry: Mapped[list[str]] = mapped_column(JSON, default=list)
    sap_modules: Mapped[list[str]] = mapped_column(JSON, default=list)
    process_domain: Mapped[list[str]] = mapped_column(JSON, default=list)
    ai_capabilities: Mapped[list[str]] = mapped_column(JSON, default=list)
    customer_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    pain_point: Mapped[str | None] = mapped_column(Text, nullable=True)
    human_process: Mapped[str | None] = mapped_column(Text, nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(128), nullable=True)
    volume: Mapped[str | None] = mapped_column(String(128), nullable=True)
    kpi_candidates: Mapped[list[str]] = mapped_column(JSON, default=list)
    data_basis: Mapped[str | None] = mapped_column(Text, nullable=True)
    willingness_to_pay: Mapped[str] = mapped_column(String(16), default=WillingnessToPay.UNKNOWN)
    estimated_value: Mapped[str | None] = mapped_column(String(256), nullable=True)

    # 关系与治理字段
    submitter_id: Mapped[str] = mapped_column(String(36), ForeignKey("sys_user.id"), index=True)
    owner_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("sys_user.id"), nullable=True
    )
    duplicate_of: Mapped[str | None] = mapped_column(String(36), nullable=True)
    confidentiality_level: Mapped[str] = mapped_column(
        String(16), default=Confidentiality.INTERNAL
    )

    # 初筛结论快照（最新一次初筛评分写回，便于列表展示）
    latest_weighted_score: Mapped[float | None] = mapped_column(nullable=True)
    latest_recommendation: Mapped[str | None] = mapped_column(String(16), nullable=True)


class ScenarioComment(TenantTimestampMixin, Base):
    __tablename__ = "biz_scenario_comment"

    scenario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("biz_scenario.id"), index=True
    )
    author_id: Mapped[str] = mapped_column(String(36), ForeignKey("sys_user.id"))
    content: Mapped[str] = mapped_column(Text)


class ScenarioAttachment(TenantTimestampMixin, Base):
    __tablename__ = "biz_scenario_attachment"

    scenario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("biz_scenario.id"), index=True
    )
    uploader_id: Mapped[str] = mapped_column(String(36), ForeignKey("sys_user.id"))
    filename: Mapped[str] = mapped_column(String(256))
    # 样本数据不入库，仅记录链接（§11.2）
    file_url: Mapped[str] = mapped_column(String(1024))
    confidentiality_level: Mapped[str] = mapped_column(String(16), default="internal")
