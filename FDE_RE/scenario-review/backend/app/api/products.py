"""产品化资产（§6.8）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.database import get_db
from app.models.enums import Role
from app.models.product import ProductAsset
from app.models.scenario import Scenario
from app.models.user import User
from app.schemas.phase2 import AssetCreate, AssetOut, AssetUpdate

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[AssetOut])
async def list_assets(
    scenario_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ProductAsset]:
    q = select(ProductAsset).order_by(ProductAsset.created_at.desc())
    if scenario_id:
        q = q.where(ProductAsset.scenario_id == scenario_id)
    return list((await db.execute(q)).scalars().all())


@router.post("/scenario/{scenario_id}", response_model=AssetOut, status_code=201)
async def create_asset(
    scenario_id: str,
    payload: AssetCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER, Role.OWNER, Role.AI_REP)),
) -> ProductAsset:
    sc = await db.get(Scenario, scenario_id)
    if not sc:
        raise HTTPException(404, "场景不存在")
    a = ProductAsset(
        scenario_id=scenario_id,
        owner_id=user.id,
        tenant_id=sc.tenant_id,
        **payload.model_dump(),
    )
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return a


@router.put("/{asset_id}", response_model=AssetOut)
async def update_asset(
    asset_id: str,
    payload: AssetUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(Role.ADMIN, Role.MANAGER, Role.OWNER, Role.AI_REP)),
) -> ProductAsset:
    a = await db.get(ProductAsset, asset_id)
    if not a:
        raise HTTPException(404, "资产不存在")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    await db.commit()
    await db.refresh(a)
    return a
