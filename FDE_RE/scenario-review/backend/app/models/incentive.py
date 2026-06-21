"""激励积分记录（§6.9）。贡献档案由积分聚合得到，不单独建表。"""
from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantTimestampMixin


class PointRecord(TenantTimestampMixin, Base):
    __tablename__ = "biz_point_record"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("sys_user.id"), index=True)
    scenario_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    event: Mapped[str] = mapped_column(String(32))
    points: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(String(256), nullable=True)
