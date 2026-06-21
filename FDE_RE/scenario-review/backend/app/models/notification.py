"""通知模型（§10，MVP一期实现站内信）。"""
from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantTimestampMixin


class Notification(TenantTimestampMixin, Base):
    __tablename__ = "biz_notification"

    recipient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sys_user.id"), index=True
    )
    event: Mapped[str] = mapped_column(String(64))
    title: Mapped[str] = mapped_column(String(256))
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    scenario_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
