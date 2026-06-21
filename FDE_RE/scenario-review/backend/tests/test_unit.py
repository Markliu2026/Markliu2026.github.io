"""单元测试：四维评分、ROI 测算、状态机。"""
from __future__ import annotations

from app.models.enums import Role
from app.models.enums import ScenarioStatus as S
from app.services import roi, scoring, state_machine


def test_weighted_score():
    # 5*.4 + 4*.25 + 4*.2 + 4*.15 = 2 + 1 + .8 + .6 = 4.4
    assert scoring.compute_weighted_score(5, 4, 4, 4) == 4.4
    assert scoring.compute_weighted_score(1, 1, 1, 1) == 1.0


def test_classify_levels():
    assert scoring.classify(4.4) == "P0"
    assert scoring.classify(3.5) == "P1"
    assert scoring.classify(2.5) == "P2"
    assert scoring.classify(1.5) == "reject"


def test_veto_downgrade():
    # 高分但命中否决项 → 不得给 P0/P1（§6.3.3）
    r = scoring.compute(5, 5, 5, 5, veto_flags=["roi_undefinable"])
    assert r.weighted_score == 5.0
    assert r.recommendation == "need_info"
    # 无否决项 → P0
    assert scoring.compute(5, 5, 5, 5).recommendation == "P0"


def test_veto_validation():
    assert scoring.validate_veto_flags(["roi_undefinable", "bogus"]) == ["roi_undefinable"]


def test_roi_compute():
    r = roi.compute_roi(labor_saving=120, business_improvement=80, poc_investment=50, ops_cost=30)
    assert r.annual_benefit == 200
    assert r.total_investment == 80
    assert r.roi_multiple == 2.5
    # 回收期 = 80 / (200/12) = 4.8 月
    assert r.payback_months == 4.8


def test_roi_zero_investment():
    r = roi.compute_roi(labor_saving=100)
    assert r.roi_multiple is None  # 无投入不计算倍数


def test_state_machine_allowed():
    assert state_machine.can_transition(S.DRAFT, S.SUBMITTED, [Role.SUBMITTER])
    assert state_machine.can_transition(S.PENDING_REVIEW, S.POC_SUGGEST, [Role.REVIEWER])
    assert state_machine.can_transition(S.POC_SUGGEST, S.POC_RUNNING, [Role.MANAGER])


def test_state_machine_role_denied():
    # 提报人不能把已提交流转到初筛中
    assert not state_machine.can_transition(S.SUBMITTED, S.SCREENING, [Role.SUBMITTER])
    # 评委不能立项 POC（需管理层）
    assert not state_machine.can_transition(S.POC_SUGGEST, S.POC_RUNNING, [Role.REVIEWER])


def test_state_machine_invalid_path():
    assert not state_machine.can_transition(S.DRAFT, S.POC_RUNNING, [Role.ADMIN])


def test_state_machine_assert_raises():
    try:
        state_machine.assert_transition(S.DRAFT, S.PRODUCTIZED, [Role.ADMIN])
    except state_machine.TransitionError:
        return
    raise AssertionError("应抛出 TransitionError")
