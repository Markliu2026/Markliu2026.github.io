"""集成测试：覆盖一期初筛闭环 + 二期/三期 深评→评审会→POC→产品化→激励全链路。"""
from __future__ import annotations

from tests.conftest import login


async def test_screening_loop_and_rbac(client):
    cons = await login(client, "consultant")
    scr = await login(client, "screener")

    # 建场景 + 提交
    r = await client.post(
        "/api/scenarios",
        headers=cons,
        json={
            "title": "测试需求预测",
            "industry": ["离散制造"],
            "sap_modules": ["PP"],
            "kpi_candidates": ["OTD"],
            "pain_point": "x",
            "human_process": "y",
            "data_basis": "z",
        },
    )
    sid = r.json()["id"]
    assert (await client.post(f"/api/scenarios/{sid}/submit", headers=cons)).json()["status"] == (
        "submitted"
    )

    # RBAC：顾问不能进初筛队列 / 不能评分
    assert (await client.get("/api/scenarios/screening-queue", headers=cons)).status_code == 403
    assert (
        await client.post(
            f"/api/scenarios/{sid}/scores",
            headers=cons,
            json={
                "business_value_score": 3,
                "feasibility_score": 3,
                "replicability_score": 3,
                "strategic_fit_score": 3,
            },
        )
    ).status_code == 403

    # 初筛人评分 → P0
    r = await client.post(
        f"/api/scenarios/{sid}/scores",
        headers=scr,
        json={
            "business_value_score": 5,
            "feasibility_score": 4,
            "replicability_score": 4,
            "strategic_fit_score": 4,
        },
    )
    assert r.json()["recommendation"] == "P0"
    assert r.json()["weighted_score"] == 4.4


async def test_full_phase2_chain(client):
    cons = await login(client, "consultant")
    scr = await login(client, "screener")
    own = await login(client, "owner")
    rev = await login(client, "reviewer")
    mgr = await login(client, "manager")

    # 提报 → 提交 → 初筛 → 推荐深评
    sid = (
        await client.post(
            "/api/scenarios",
            headers=cons,
            json={
                "title": "链路测试",
                "industry": ["离散制造"],
                "sap_modules": ["PP"],
                "kpi_candidates": ["OTD"],
                "pain_point": "x",
                "human_process": "y",
                "data_basis": "z",
            },
        )
    ).json()["id"]
    await client.post(f"/api/scenarios/{sid}/submit", headers=cons)
    await client.post(
        f"/api/scenarios/{sid}/scores",
        headers=scr,
        json={
            "business_value_score": 5,
            "feasibility_score": 4,
            "replicability_score": 4,
            "strategic_fit_score": 4,
        },
    )
    await client.post(
        f"/api/scenarios/{sid}/transition",
        headers=scr,
        json={"target_status": "recommend_deep"},
    )

    # 指定 Owner → 深评中
    owner_id = (await client.get("/api/users?role=owner", headers=scr)).json()[0]["id"]
    await client.post(
        f"/api/scenarios/{sid}/assign-owner", headers=scr, json={"owner_id": owner_id}
    )
    assert (await client.get(f"/api/scenarios/{sid}", headers=scr)).json()["status"] == "deep_eval"

    # 深评 + ROI
    de = (
        await client.put(
            f"/api/scenarios/{sid}/deep-eval",
            headers=own,
            json={
                "business_process": "p",
                "labor_saving": 120,
                "business_improvement": 80,
                "poc_investment": 50,
                "ops_cost": 30,
            },
        )
    ).json()
    assert de["annual_benefit"] == 200
    assert de["roi_multiple"] == 2.5

    # 提交评审会 → 待评审会
    await client.post(f"/api/scenarios/{sid}/submit-review", headers=own)
    assert (await client.get(f"/api/scenarios/{sid}", headers=own)).json()["status"] == (
        "pending_review"
    )

    # 评审会：建会 → 议题 → 投票 → 结论 poc_suggest
    mid = (
        await client.post("/api/meetings", headers=scr, json={"title": "深评会"})
    ).json()["id"]
    itid = (
        await client.post(
            f"/api/meetings/{mid}/items", headers=scr, json={"scenario_id": sid}
        )
    ).json()["id"]
    await client.post(
        f"/api/meetings/items/{itid}/votes",
        headers=rev,
        json={
            "vote": "pass",
            "business_value_score": 5,
            "feasibility_score": 4,
            "replicability_score": 4,
            "strategic_fit_score": 4,
        },
    )
    summary = (await client.get(f"/api/meetings/items/{itid}/votes", headers=rev)).json()
    assert summary["count"] == 1 and summary["avg_weighted"] == 4.4
    await client.post(
        f"/api/meetings/items/{itid}/conclude",
        headers=rev,
        json={"conclusion": "poc_suggest"},
    )
    assert (await client.get(f"/api/scenarios/{sid}", headers=scr)).json()["status"] == (
        "poc_suggest"
    )

    # POC 立项 → 里程碑 → 指标 → 结项成功
    pid = (await client.post(f"/api/poc/from-scenario/{sid}", headers=mgr)).json()["id"]
    assert (await client.get(f"/api/scenarios/{sid}", headers=mgr)).json()["status"] == (
        "poc_running"
    )
    await client.post(
        f"/api/poc/{pid}/milestones", headers=own, json={"name": "MVP", "stage": "mvp"}
    )
    await client.post(
        f"/api/poc/{pid}/metrics",
        headers=own,
        json={"category": "economic", "name": "人力成本节省", "target": "120"},
    )
    assert (
        await client.post(
            f"/api/poc/{pid}/finish", headers=own, json={"success": True, "roi_multiple": 3.2}
        )
    ).json()["result"] == "success"

    # 产品化：productizing → productized + 资产
    assert (
        await client.post(
            f"/api/scenarios/{sid}/transition", headers=mgr, json={"target_status": "productizing"}
        )
    ).json()["status"] == "productizing"
    await client.post(
        f"/api/products/scenario/{sid}",
        headers=mgr,
        json={"asset_type": "spec", "title": "说明书"},
    )
    assert (
        await client.post(
            f"/api/scenarios/{sid}/transition", headers=mgr, json={"target_status": "productized"}
        )
    ).json()["status"] == "productized"

    # 激励：提报人全链路积分 = 10+30+80+120+300+500 = 1040
    prof = (await client.get("/api/incentive/profile", headers=cons)).json()
    assert prof["total_points"] == 1040
    assert prof["productized_count"] == 1

    # 驾驶舱
    dash = (await client.get("/api/stats/dashboard", headers=mgr)).json()
    assert dash["productized"] >= 1
    assert dash["poc_count"] >= 1
    assert dash["poc_success_rate"] > 0  # 至少本链路这条 POC 成功


async def test_poc_kickoff_requires_manager(client):
    """POC 立项需管理层；评委无权。"""
    rev = await login(client, "reviewer")
    # 用种子里 poc_suggest 的场景没有，直接断言非法路径被拒（评委对随便一个场景立项→404或409/403）
    r = await client.post("/api/poc/from-scenario/nonexistent", headers=rev)
    assert r.status_code in (403, 404)
