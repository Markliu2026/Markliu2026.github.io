"""种子数据：各角色用户 + 示例场景（含 6 个案例样版）。

幂等：用户按 username、示例场景按 title 去重，可重复运行 / 容器多次启动。
运行： uv run python -m app.seed
"""
from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.database import SessionLocal, init_db
from app.models.enums import Role, ScenarioStatus, ScoreType, WillingnessToPay
from app.models.review import ReviewScore
from app.models.scenario import Scenario
from app.models.user import User
from app.security import hash_password
from app.services import scoring

DEFAULT_PASSWORD = "Passw0rd!"

USERS = [
    ("consultant", "顾问·张工", [Role.SUBMITTER], "离散制造事业部"),
    ("owner", "Owner·李工", [Role.OWNER, Role.SUBMITTER], "流程制造事业部"),
    ("screener", "初筛人·王经理", [Role.SCREENER], "数智工程师创新中心"),
    ("reviewer", "评委·赵专家", [Role.REVIEWER], "评审委员会"),
    ("airep", "AI研发·钱工", [Role.AI_REP], "AI研发团队"),
    ("manager", "管理层·孙总", [Role.MANAGER], "创新中心"),
    ("admin", "系统管理员", [Role.ADMIN], "IT"),
]

# 6 个案例样版（与前端 lib/templates.ts 对应），含状态与初筛分以填充场景库/初筛队列。
# score = (业务价值, 技术可行性, 可复制性, 战略契合)，为 None 表示尚未评分。
EXAMPLES = [
    {
        "title": "APS 计划排程数智工程师",
        "status": ScenarioStatus.RECOMMEND_DEEP,
        "submitter": "consultant",
        "industry": ["离散制造", "装备制造"],
        "sap_modules": ["PP", "MM"],
        "ai_capabilities": ["优化", "预测"],
        "customer_name": "某装备制造客户（脱敏）",
        "pain_point": "多工厂多产线、换型成本高、插单频繁，计划员用Excel凭经验排产，"
        "计划稳定性差，齐套率与设备利用率低，交付经常延误。",
        "human_process": "资深计划员每天2-3小时手工平衡订单优先级、产能、物料齐套与换型顺序，强依赖个人经验。",
        "frequency": "每日滚动排产 + 插单实时重排",
        "volume": "约800个工单 / 30条产线 / 5000+物料",
        "kpi_candidates": ["OTD", "设备利用率(OEE)", "换型次数", "计划达成率"],
        "data_basis": "订单/工单/BOM/工艺路线/产能日历在SAP PP可得；设备状态来自MES可接口；约束规则需共建。",
        "willingness_to_pay": WillingnessToPay.STRONG,
        "estimated_value": "交付准时率+10~15%，换型成本下降，计划编制工时下降70%",
        "score": (5, 4, 4, 5),
    },
    {
        "title": "财务审单智能稽核数智工程师",
        "status": ScenarioStatus.SUBMITTED,
        "submitter": "owner",
        "industry": ["流程制造", "消费品"],
        "sap_modules": ["FICO"],
        "ai_capabilities": ["审核", "异常识别"],
        "customer_name": "某消费品集团（脱敏）",
        "pain_point": "月结期间大量凭证与报销单据靠人工逐笔稽核，规则多口径杂，耗时易漏，月结天数长，合规风险高。",
        "human_process": "财务共享中心数十人按检查清单人工核对科目、税率、附件、预算与合同一致性，月结日集中加班。",
        "frequency": "每日单据稽核 + 月度结账集中稽核",
        "volume": "每月数万张凭证/报销单",
        "kpi_candidates": ["月结天数", "稽核覆盖率", "差错率", "合规问题检出率"],
        "data_basis": "凭证、主数据、税码、预算、合同在SAP FICO可得；发票影像在影像系统可接口；规则可结构化。",
        "willingness_to_pay": WillingnessToPay.STRONG,
        "estimated_value": "稽核工时下降60%，月结缩短1-2天，合规检出率提升",
        "score": None,
    },
    {
        "title": "经营分析智能问数数智工程师",
        "status": ScenarioStatus.SCREENING,
        "submitter": "consultant",
        "industry": ["离散制造", "流程制造", "消费品"],
        "sap_modules": ["FICO", "SD", "CO"],
        "ai_capabilities": ["生成", "RAG", "Agent"],
        "customer_name": "某制造集团总部（脱敏）",
        "pain_point": "管理层临时取数需求多，依赖IT/分析师写报表与SQL，响应慢；口径不统一，同一指标多版本，决策效率低。",
        "human_process": "业务提需求→分析师理解口径→写SQL/做报表→反复确认，平均1-3天，长尾问题无人响应。",
        "frequency": "每日高频临时问数 + 月度经营分析",
        "volume": "数百名管理者/分析师，月问数上千次",
        "kpi_candidates": ["取数响应时长", "自助分析占比", "指标口径一致率", "报表开发工时"],
        "data_basis": "经营数据在SAP/BW/数仓可得；需建指标语义层与口径字典；权限按组织与数据分级控制。",
        "willingness_to_pay": WillingnessToPay.MEDIUM,
        "estimated_value": "取数从天级到分钟级，分析师人力释放40%+，口径统一",
        "score": (4, 3, 4, 3),
    },
    {
        "title": "QMS 视觉质检数智工程师",
        "status": ScenarioStatus.OBSERVING,
        "submitter": "owner",
        "industry": ["离散制造", "新能源", "汽车"],
        "sap_modules": ["QM", "PP"],
        "ai_capabilities": ["异常识别", "多模态"],
        "customer_name": "某新能源电池客户（脱敏）",
        "pain_point": "外观/焊点/极片缺陷靠人工目检，疲劳漏检、标准不一、节拍跟不上产线，质量数据难追溯。",
        "human_process": "质检员在产线逐件目视检查并手工记录缺陷类型，凭经验判级，培训周期长、一致性差。",
        "frequency": "产线实时在线检测（按节拍）",
        "volume": "单线每日数万件，多缺陷类别",
        "kpi_candidates": ["漏检率", "误检率", "检测节拍", "人均检验产能", "质量追溯完整率"],
        "data_basis": "需采集缺陷图像并标注（样本量与标注质量是关键）；结果写回SAP QM质检批；与MES/相机系统对接。",
        "willingness_to_pay": WillingnessToPay.STRONG,
        "estimated_value": "漏检率显著下降，质检人力下降50%+，缺陷数据可追溯",
        "score": (2, 3, 2, 3),
    },
    {
        "title": "主数据清理与治理数智工程师",
        "status": ScenarioStatus.SUBMITTED,
        "submitter": "consultant",
        "industry": ["离散制造", "流程制造"],
        "sap_modules": ["MDG", "MM"],
        "ai_capabilities": ["异常识别", "生成"],
        "customer_name": "某集团共享中心（脱敏）",
        "pain_point": "物料/供应商/客户主数据重复、字段缺失、命名不规范，导致采购/库存/报表口径混乱，集成频繁出错。",
        "human_process": "数据专员凭经验人工查重、补全分类与描述、核对规范，工作量大、标准难统一、清理后又快速劣化。",
        "frequency": "存量批量清理 + 新建实时校验",
        "volume": "存量数十万条主数据，每月新增数千条",
        "kpi_candidates": ["重复率", "字段完整率", "规范符合率", "清理工时", "集成报错率"],
        "data_basis": "主数据在SAP MDG/ECC可得；需沉淀分类与命名规则、相似度阈值；高风险变更须人工确认与审批留痕。",
        "willingness_to_pay": WillingnessToPay.MEDIUM,
        "estimated_value": "重复率/报错率大幅下降，清理工时下降60%，数据质量可持续",
        "score": None,
    },
    {
        "title": "采购到货预测与智能寻源数智工程师",
        "status": ScenarioStatus.RECOMMEND_DEEP,
        "submitter": "owner",
        "industry": ["离散制造", "装备制造"],
        "sap_modules": ["MM", "MDG"],
        "ai_capabilities": ["预测", "优化", "Agent"],
        "customer_name": "某装备制造客户（脱敏）",
        "pain_point": "供应商交付波动大，到货延迟常导致停线；询比价与寻源靠人工，采购员凭经验催货，缺乏前瞻预警。",
        "human_process": "采购员人工跟踪在途订单、电话催货、Excel比价，问题暴露时往往已影响生产，难以提前干预。",
        "frequency": "每日到货风险预警 + 寻源按需",
        "volume": "数千张采购订单/数百家供应商",
        "kpi_candidates": ["到货准时率", "缺料停线次数", "采购周期", "寻源成本节省"],
        "data_basis": "采购订单/收货/供应商主数据/历史交付在SAP MM可得；价格与评估数据需治理；预警须人工确认后行动。",
        "willingness_to_pay": WillingnessToPay.MEDIUM,
        "estimated_value": "到货准时率提升，缺料停线下降，采购跟单工时下降50%",
        "score": (5, 4, 4, 4),
    },
]


async def ensure_users(db) -> dict[str, User]:
    existing = {u.username: u for u in (await db.execute(select(User))).scalars().all()}
    for username, name, roles, dept in USERS:
        if username in existing:
            continue
        u = User(
            username=username,
            display_name=name,
            email=f"{username}@example.com",
            hashed_password=hash_password(DEFAULT_PASSWORD),
            roles=[str(r) for r in roles],
            department=dept,
        )
        db.add(u)
        existing[username] = u
    await db.flush()
    return existing


async def ensure_examples(db, users: dict[str, User]) -> int:
    # 取已存在标题用于去重
    existing_titles = set((await db.execute(select(Scenario.title))).scalars().all())
    added = 0
    for ex in EXAMPLES:
        if ex["title"] in existing_titles:
            continue
        score = ex.get("score")
        sc = Scenario(
            title=ex["title"],
            status=ex["status"],
            industry=ex["industry"],
            sap_modules=ex["sap_modules"],
            ai_capabilities=ex["ai_capabilities"],
            customer_name=ex["customer_name"],
            pain_point=ex["pain_point"],
            human_process=ex["human_process"],
            frequency=ex["frequency"],
            volume=ex["volume"],
            kpi_candidates=ex["kpi_candidates"],
            data_basis=ex["data_basis"],
            willingness_to_pay=ex["willingness_to_pay"],
            estimated_value=ex["estimated_value"],
            submitter_id=users[ex["submitter"]].id,
        )
        db.add(sc)
        await db.flush()
        if score:
            bv, feas, rep, strat = score
            res = scoring.compute(bv, feas, rep, strat)
            db.add(
                ReviewScore(
                    scenario_id=sc.id,
                    reviewer_id=users["screener"].id,
                    score_type=ScoreType.SCREENING,
                    business_value_score=bv,
                    feasibility_score=feas,
                    replicability_score=rep,
                    strategic_fit_score=strat,
                    weighted_score=res.weighted_score,
                    recommendation=res.recommendation,
                    veto_flags=[],
                    comment="初筛评分（示例数据）",
                )
            )
            sc.latest_weighted_score = res.weighted_score
            sc.latest_recommendation = res.recommendation
        added += 1
    return added


async def seed() -> None:
    await init_db()
    async with SessionLocal() as db:
        users = await ensure_users(db)
        added = await ensure_examples(db, users)
        await db.commit()
    print(f"种子完成：用户已就绪，新增示例场景 {added} 个。")
    print(f"默认密码：{DEFAULT_PASSWORD}")
    print("账号：", ", ".join(u[0] for u in USERS))


if __name__ == "__main__":
    asyncio.run(seed())
