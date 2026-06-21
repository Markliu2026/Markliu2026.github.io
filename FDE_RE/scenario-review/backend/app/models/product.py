"""产品化资产（§6.8 / §7.5）。"""
from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantTimestampMixin


class ProductAsset(TenantTimestampMixin, Base):
    __tablename__ = "biz_product_asset"

    scenario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("biz_scenario.id"), index=True
    )
    poc_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    asset_type: Mapped[str] = mapped_column(String(32))
    # spec/interface/eval_set/prompt/roi_template/sop/case/...
    title: Mapped[str] = mapped_column(String(256))
    owner_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    version: Mapped[str] = mapped_column(String(32), default="v1.0")
    file_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    reusable_level: Mapped[str] = mapped_column(String(16), default="customer")
    # customer/industry/generic
    status: Mapped[str] = mapped_column(String(16), default="draft")
    # draft/reviewing/reusable/deprecated
