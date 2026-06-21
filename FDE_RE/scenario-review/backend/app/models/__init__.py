"""模型聚合导出（供 metadata.create_all 注册）。"""
from app.models.notification import Notification
from app.models.review import ReviewScore
from app.models.scenario import Scenario, ScenarioAttachment, ScenarioComment
from app.models.user import User

__all__ = [
    "User",
    "Scenario",
    "ScenarioComment",
    "ScenarioAttachment",
    "ReviewScore",
    "Notification",
]
