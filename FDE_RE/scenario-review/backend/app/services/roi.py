"""ROI 测算（§6.7.3）。

年化收益 = 人力节省 + 业务改善 + 风险减少 + 增收
总投入   = POC投入 + 产品化投入 + 部署运维
ROI倍数  = 年化收益 / 总投入
回收期(月) = 总投入 / 月均收益
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RoiResult:
    annual_benefit: float
    total_investment: float
    roi_multiple: float | None
    payback_months: float | None


def compute_roi(
    labor_saving: float = 0,
    business_improvement: float = 0,
    risk_reduction: float = 0,
    revenue_increase: float = 0,
    poc_investment: float = 0,
    productization_investment: float = 0,
    ops_cost: float = 0,
) -> RoiResult:
    annual = (labor_saving or 0) + (business_improvement or 0) + (risk_reduction or 0) + (
        revenue_increase or 0
    )
    total = (poc_investment or 0) + (productization_investment or 0) + (ops_cost or 0)
    roi_multiple = round(annual / total, 2) if total > 0 else None
    payback = round(total / (annual / 12), 1) if annual > 0 else None
    return RoiResult(
        annual_benefit=round(annual, 2),
        total_investment=round(total, 2),
        roi_multiple=roi_multiple,
        payback_months=payback,
    )
