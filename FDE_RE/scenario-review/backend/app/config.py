"""应用配置（pydantic-settings）。"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # 数据库
    database_url: str = "sqlite+aiosqlite:///./scenario_review.db"

    # JWT
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 720

    # 多租户（MVP一期单租户）
    default_tenant_id: str = "t-default"

    # 启动时若库为空则写入种子数据（容器首跑用）
    seed_on_start: bool = False

    # CORS（逗号分隔）
    cors_origins: str = "http://localhost:3100"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
