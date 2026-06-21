"""深度评估材料（§6.4）+ ROI 测算（§6.7.3）。"""
from __future__ import annotations

from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantTimestampMixin


class DeepEvaluation(TenantTimestampMixin, Base):
    __tablename__ = "biz_deep_evaluation"

    scenario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("biz_scenario.id"), unique=True, index=True
    )

    # 深评清单（§6.4.1 / §6.4.2）
    business_process: Mapped[str | None] = mapped_column(Text, nullable=True)  # 业务流程评估
    data_diligence: Mapped[str | None] = mapped_column(Text, nullable=True)    # 数据尽调
    ai_capability_fit: Mapped[str | None] = mapped_column(Text, nullable=True)  # AI能力评估
    closed_loop: Mapped[str | None] = mapped_column(Text, nullable=True)       # 闭环可行性
    risks: Mapped[str | None] = mapped_column(Text, nullable=True)             # 风险评估
    resources: Mapped[str | None] = mapped_column(Text, nullable=True)         # 资源评估
    productization_potential: Mapped[str | None] = mapped_column(Text, nullable=True)
    baseline: Mapped[str | None] = mapped_column(Text, nullable=True)          # ROI baseline 说明

    # ROI 测算输入（年化，单位：万元）
    labor_saving: Mapped[float] = mapped_column(Float, default=0)
    business_improvement: Mapped[float] = mapped_column(Float, default=0)
    risk_reduction: Mapped[float] = mapped_column(Float, default=0)
    revenue_increase: Mapped[float] = mapped_column(Float, default=0)
    poc_investment: Mapped[float] = mapped_column(Float, default=0)
    productization_investment: Mapped[float] = mapped_column(Float, default=0)
    ops_cost: Mapped[float] = mapped_column(Float, default=0)

    # ROI 计算结果（回写）
    annual_benefit: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_investment: Mapped[float | None] = mapped_column(Float, nullable=True)
    roi_multiple: Mapped[float | None] = mapped_column(Float, nullable=True)
    payback_months: Mapped[float | None] = mapped_column(Float, nullable=True)
