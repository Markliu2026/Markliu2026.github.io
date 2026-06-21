"""枚举定义（对齐设计文档 §3 角色、§5 状态机、§6.3 评分）。"""
from __future__ import annotations

from enum import StrEnum


class Role(StrEnum):
    """用户角色（§3）。"""

    SUBMITTER = "submitter"          # 场景提报人
    OWNER = "owner"                  # 场景 Owner
    SCREENER = "screener"            # 创新中心初筛人
    REVIEWER = "reviewer"            # 评审委员会成员
    AI_REP = "ai_rep"               # AI 研发代表
    MANAGER = "manager"              # 管理层
    ADMIN = "admin"                  # 系统管理员


class ScenarioStatus(StrEnum):
    """场景状态（§5.1）。MVP一期聚焦提报与初筛闭环，但完整状态集合一并定义以便演进。"""

    DRAFT = "draft"                  # 草稿
    SUBMITTED = "submitted"          # 已提交
    NEED_INFO = "need_info"          # 待补充
    SCREENING = "screening"          # 初筛中
    OBSERVING = "observing"          # 入库观察
    RECOMMEND_DEEP = "recommend_deep"  # 推荐深评
    REJECTED = "rejected"            # 已淘汰
    MERGED = "merged"                # 已合并


class ScoreType(StrEnum):
    SCREENING = "screening"          # 初筛
    DEEP = "deep"                    # 深评
    MEETING = "meeting"              # 评审会


class Recommendation(StrEnum):
    """评分推荐结论（§6.3.2 / §7.3）。"""

    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    REJECT = "reject"                # 淘汰
    NEED_INFO = "need_info"          # 补充
    MERGE = "merge"                  # 合并


class WillingnessToPay(StrEnum):
    STRONG = "strong"
    MEDIUM = "medium"
    WEAK = "weak"
    UNKNOWN = "unknown"


class Confidentiality(StrEnum):
    """数据分级（§11.1）。"""

    PUBLIC = "public"                # 公开
    INTERNAL = "internal"            # 内部
    SENSITIVE = "sensitive"          # 敏感
    CONFIDENTIAL = "confidential"    # 客户机密


# 否决项（§6.3.3）。命中任一不可直接进入 POC 建议。
VETO_FLAGS: dict[str, str] = {
    "no_business_owner": "无明确业务Owner",
    "no_data_in_3m": "三个月内无法获得数据样本",
    "demo_only": "只能做演示，无法进入真实流程",
    "roi_undefinable": "ROI无法定义",
    "compliance_risk": "安全、合规、隐私或客户数据风险不可控",
    "full_auto_no_human": "关键动作要求完全自动化且没有人工确认",
}
