"""四维评分计算与分级（§6.3）。

权重可配置（§14 / §23），MVP一期内置默认权重；后续接入 score_weight_config 表。
综合得分 = Σ(各维度得分 × 权重)，维度分 1-5。
"""
from __future__ import annotations

from dataclasses import dataclass

from app.models.enums import VETO_FLAGS, Recommendation

# 默认权重（§6.3.1）
WEIGHTS: dict[str, float] = {
    "business_value": 0.40,
    "feasibility": 0.25,
    "replicability": 0.20,
    "strategic_fit": 0.15,
}


@dataclass
class ScoreResult:
    weighted_score: float
    recommendation: str


def compute_weighted_score(
    business_value: float,
    feasibility: float,
    replicability: float,
    strategic_fit: float,
) -> float:
    raw = (
        business_value * WEIGHTS["business_value"]
        + feasibility * WEIGHTS["feasibility"]
        + replicability * WEIGHTS["replicability"]
        + strategic_fit * WEIGHTS["strategic_fit"]
    )
    return round(raw, 2)


def classify(weighted_score: float) -> str:
    """分级规则（§6.3.2）。"""
    if weighted_score >= 4.0:
        return Recommendation.P0
    if weighted_score >= 3.0:
        return Recommendation.P1
    if weighted_score >= 2.0:
        return Recommendation.P2
    return Recommendation.REJECT


def compute(
    business_value: float,
    feasibility: float,
    replicability: float,
    strategic_fit: float,
    veto_flags: list[str] | None = None,
) -> ScoreResult:
    """计算加权分与建议结论。命中否决项时不得给出 P0/P1 直通结论。"""
    score = compute_weighted_score(business_value, feasibility, replicability, strategic_fit)
    recommendation = classify(score)
    if veto_flags:
        # 否决项命中（§6.3.3）：系统不允许直接进入 POC 建议，
        # 强制降级为「补充」，由初筛人选择退回补充/入库观察/淘汰。
        if recommendation in (Recommendation.P0, Recommendation.P1):
            recommendation = Recommendation.NEED_INFO
    return ScoreResult(weighted_score=score, recommendation=recommendation)


def validate_veto_flags(flags: list[str]) -> list[str]:
    """过滤非法否决项 key。"""
    return [f for f in flags if f in VETO_FLAGS]
