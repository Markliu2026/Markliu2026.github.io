"""用户与角色模型（MVP一期用角色字符串列表，RBAC 简化但可演进到 §17）。"""
from __future__ import annotations

from sqlalchemy import JSON, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantTimestampMixin


class User(TenantTimestampMixin, Base):
    __tablename__ = "sys_user"

    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(128))
    email: Mapped[str | None] = mapped_column(String(256), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(256))
    # 角色集合，元素取 enums.Role 值
    roles: Mapped[list[str]] = mapped_column(JSON, default=list)
    department: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
