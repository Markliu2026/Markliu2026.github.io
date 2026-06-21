"""POC 项目、里程碑、价值指标（§6.6 / §6.7）。"""
from __future__ import annotations

from sqlalchemy import Boolean, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantTimestampMixin


class PocProject(TenantTimestampMixin, Base):
    __tablename__ = "biz_poc_project"

    scenario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("biz_scenario.id"), unique=True, index=True
    )
    customer: Mapped[str | None] = mapped_column(String(256), nullable=True)
    owner_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    stage: Mapped[str] = mapped_column(String(16), default="kickoff")
    # kickoff/diagnose/mvp/closedloop/validate/done
    start_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    end_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    baseline_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_level: Mapped[str] = mapped_column(String(8), default="low")  # low/mid/high
    result: Mapped[str] = mapped_column(String(16), default="running")  # running/success/failed
    roi_multiple: Mapped[float | None] = mapped_column(Float, nullable=True)
    payback_months: Mapped[float | None] = mapped_column(Float, nullable=True)

    # 周报字段（§6.6.2）
    progress: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    blockers: Mapped[str | None] = mapped_column(Text, nullable=True)
    need_mgmt: Mapped[str | None] = mapped_column(Text, nullable=True)


class Milestone(TenantTimestampMixin, Base):
    __tablename__ = "biz_milestone"

    poc_id: Mapped[str] = mapped_column(String(36), ForeignKey("biz_poc_project.id"), index=True)
    name: Mapped[str] = mapped_column(String(256))
    stage: Mapped[str | None] = mapped_column(String(16), nullable=True)
    due_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    done: Mapped[bool] = mapped_column(Boolean, default=False)


class ValueMetric(TenantTimestampMixin, Base):
    """价值指标（§6.7.1 / §6.7.2）。"""

    __tablename__ = "biz_value_metric"

    poc_id: Mapped[str] = mapped_column(String(36), ForeignKey("biz_poc_project.id"), index=True)
    category: Mapped[str] = mapped_column(String(16), default="business")
    # efficiency/quality/economic/business
    name: Mapped[str] = mapped_column(String(128))
    baseline: Mapped[str | None] = mapped_column(String(64), nullable=True)
    target: Mapped[str | None] = mapped_column(String(64), nullable=True)
    actual: Mapped[str | None] = mapped_column(String(64), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    period: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source: Mapped[str | None] = mapped_column(String(128), nullable=True)
    formula: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner: Mapped[str | None] = mapped_column(String(64), nullable=True)
