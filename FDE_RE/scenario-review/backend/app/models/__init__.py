"""模型聚合导出（供 metadata.create_all 注册）。"""
from app.models.deep_eval import DeepEvaluation
from app.models.incentive import PointRecord
from app.models.meeting import MeetingVote, ReviewItem, ReviewMeeting
from app.models.notification import Notification
from app.models.poc import Milestone, PocProject, ValueMetric
from app.models.product import ProductAsset
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
    "DeepEvaluation",
    "ReviewMeeting",
    "ReviewItem",
    "MeetingVote",
    "PocProject",
    "Milestone",
    "ValueMetric",
    "ProductAsset",
    "PointRecord",
]
