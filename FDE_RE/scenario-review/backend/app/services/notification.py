"""基础通知服务（§10，MVP一期站内信落库；多渠道适配器为二期）。"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def notify(
    db: AsyncSession,
    *,
    recipient_id: str,
    event: str,
    title: str,
    body: str | None = None,
    scenario_id: str | None = None,
    tenant_id: str | None = None,
) -> Notification:
    n = Notification(
        recipient_id=recipient_id,
        event=event,
        title=title,
        body=body,
        scenario_id=scenario_id,
    )
    if tenant_id:
        n.tenant_id = tenant_id
    db.add(n)
    await db.flush()
    return n
