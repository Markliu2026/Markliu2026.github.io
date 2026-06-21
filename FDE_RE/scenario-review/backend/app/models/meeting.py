"""评审会与议题、投票（§6.5）。"""
from __future__ import annotations

from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantTimestampMixin


class ReviewMeeting(TenantTimestampMixin, Base):
    __tablename__ = "biz_review_meeting"

    title: Mapped[str] = mapped_column(String(256))
    meeting_type: Mapped[str] = mapped_column(String(16), default="deep")  # initial/deep/roadshow
    meeting_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    attendees: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="planned")  # planned/done


class ReviewItem(TenantTimestampMixin, Base):
    __tablename__ = "biz_review_item"

    meeting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("biz_review_meeting.id"), index=True
    )
    scenario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("biz_scenario.id"), index=True
    )
    presenter_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    conclusion: Mapped[str | None] = mapped_column(String(16), nullable=True)  # poc_suggest/...
    action_items: Mapped[str | None] = mapped_column(Text, nullable=True)


class MeetingVote(TenantTimestampMixin, Base):
    """评委投票 + 四维评分（§6.5.3）。"""

    __tablename__ = "biz_meeting_vote"

    item_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("biz_review_item.id"), index=True
    )
    voter_id: Mapped[str] = mapped_column(String(36), ForeignKey("sys_user.id"))
    vote: Mapped[str] = mapped_column(String(16))  # pass/revise/hold/reject
    business_value_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    feasibility_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    replicability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    strategic_fit_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
