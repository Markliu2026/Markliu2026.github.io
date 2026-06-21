"""API 依赖：当前用户、角色校验（RBAC 雏形，§17.2）。"""
from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "无效或过期的令牌")
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "用户不存在或已禁用")
    return user


def require_roles(*roles: str) -> Callable:
    """生成一个依赖：要求当前用户至少拥有其中一个角色。"""

    async def checker(user: User = Depends(get_current_user)) -> User:
        if not (set(roles) & set(user.roles)):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "权限不足")
        return user

    return checker


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    res = await db.execute(select(User).where(User.username == username))
    return res.scalar_one_or_none()
