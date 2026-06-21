"""用户列表（供指定 Owner / 评委选择）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.database import get_db
from app.models.enums import Role
from app.models.user import User
from app.schemas.phase2 import UserBrief

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserBrief])
async def list_users(
    role: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(Role.SCREENER, Role.ADMIN, Role.MANAGER, Role.REVIEWER)),
) -> list[User]:
    res = await db.execute(select(User).where(User.is_active.is_(True)))
    users = list(res.scalars().all())
    if role:
        users = [u for u in users if role in (u.roles or [])]
    return users
