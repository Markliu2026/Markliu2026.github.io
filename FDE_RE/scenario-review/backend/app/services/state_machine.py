"""场景状态机（§5.2）。

MVP一期实现「提报→初筛」闭环涉及的迁移；完整流转表预置以便二期演进。
迁移表为数据驱动雏形（§19.2），后续可迁入 state_machine_config 表。
"""
from __future__ import annotations

from app.models.enums import Role, ScenarioStatus as S

# 允许的迁移：from -> {to -> 允许触发的角色集合}
TRANSITIONS: dict[str, dict[str, set[str]]] = {
    S.DRAFT: {
        S.SUBMITTED: {Role.SUBMITTER, Role.ADMIN},
    },
    S.SUBMITTED: {
        S.SCREENING: {Role.SCREENER, Role.ADMIN},
        S.NEED_INFO: {Role.SCREENER, Role.ADMIN},
    },
    S.NEED_INFO: {
        S.SUBMITTED: {Role.SUBMITTER, Role.ADMIN},
    },
    S.SCREENING: {
        S.NEED_INFO: {Role.SCREENER, Role.ADMIN},
        S.OBSERVING: {Role.SCREENER, Role.ADMIN},
        S.RECOMMEND_DEEP: {Role.SCREENER, Role.ADMIN},
        S.REJECTED: {Role.SCREENER, Role.ADMIN},
        S.MERGED: {Role.SCREENER, Role.ADMIN},
    },
    # 二期：深评 → 评审会 → POC 建议
    S.RECOMMEND_DEEP: {
        # 指定 Owner 时进入深评（见 assign-owner 接口）
        S.DEEP_EVAL: {Role.SCREENER, Role.ADMIN},
    },
    S.DEEP_EVAL: {
        S.PENDING_REVIEW: {Role.OWNER, Role.ADMIN},  # Owner 提交评审会
        S.NEED_INFO: {Role.SCREENER, Role.ADMIN},
    },
    S.PENDING_REVIEW: {
        S.POC_SUGGEST: {Role.REVIEWER, Role.MANAGER, Role.ADMIN},
        S.OBSERVING: {Role.REVIEWER, Role.MANAGER, Role.ADMIN},
        S.REJECTED: {Role.REVIEWER, Role.MANAGER, Role.ADMIN},
        S.DEEP_EVAL: {Role.REVIEWER, Role.ADMIN},  # 退回补充深评材料
    },
    # 二期：POC 阶段
    S.POC_SUGGEST: {
        S.POC_RUNNING: {Role.MANAGER, Role.ADMIN},  # 管理层确认立项
        S.OBSERVING: {Role.MANAGER, Role.ADMIN},
    },
    S.POC_RUNNING: {
        S.POC_SUCCESS: {Role.OWNER, Role.SCREENER, Role.ADMIN},
        S.POC_FAILED: {Role.OWNER, Role.SCREENER, Role.ADMIN},
    },
    # 三期：产品化
    S.POC_SUCCESS: {
        S.PRODUCTIZING: {Role.MANAGER, Role.ADMIN},
    },
    S.POC_FAILED: {
        S.OBSERVING: {Role.SCREENER, Role.ADMIN},
    },
    S.PRODUCTIZING: {
        S.PRODUCTIZED: {Role.MANAGER, Role.ADMIN},
    },
}

# 终态（当前阶段不再继续流转的状态）
TERMINAL: set[str] = {S.REJECTED, S.MERGED, S.PRODUCTIZED}


class TransitionError(Exception):
    pass


def can_transition(current: str, target: str, roles: list[str]) -> bool:
    allowed = TRANSITIONS.get(current, {})
    if target not in allowed:
        return False
    return bool(allowed[target] & set(roles))


def assert_transition(current: str, target: str, roles: list[str]) -> None:
    allowed = TRANSITIONS.get(current, {})
    if target not in allowed:
        raise TransitionError(f"不允许的状态流转：{current} → {target}")
    if not (allowed[target] & set(roles)):
        raise TransitionError(f"当前角色无权执行流转：{current} → {target}")


def next_states(current: str) -> list[str]:
    return list(TRANSITIONS.get(current, {}).keys())
