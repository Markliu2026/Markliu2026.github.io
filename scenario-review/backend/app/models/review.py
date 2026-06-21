"""评分卡模型（§6.3 四维评分 / §7.3）。"""
from __future__ import annotations

from sqlalchemy import JSON, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantTimestampMixin
from app.models.enums import ScoreType


class ReviewScore(TenantTimestampMixin, Base):
    __tablename__ = "biz_review_score"

    scenario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("biz_scenario.id"), index=True
    )
    reviewer_id: Mapped[str] = mapped_column(String(36), ForeignKey("sys_user.id"))
    score_type: Mapped[str] = mapped_column(String(16), default=ScoreType.SCREENING)

    # 四维原始分（1-5）
    business_value_score: Mapped[float] = mapped_column(Float)
    feasibility_score: Mapped[float] = mapped_column(Float)
    replicability_score: Mapped[float] = mapped_column(Float)
    strategic_fit_score: Mapped[float] = mapped_column(Float)

    # 计算结果
    weighted_score: Mapped[float] = mapped_column(Float)
    recommendation: Mapped[str] = mapped_column(String(16))

    veto_flags: Mapped[list[str]] = mapped_column(JSON, default=list)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
