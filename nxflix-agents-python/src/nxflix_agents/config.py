"""Configuration settings for the agent runtime."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # Database
    database_url: str = "postgresql://localhost:5432/nxflix"

    # Default LLM provider and model
    default_provider: Literal["openai", "anthropic", "gemini", "ollama"] = "openai"
    default_model: str = "gpt-4o-mini"

    # API Keys
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""

    # Ollama
    ollama_base_url: str = "http://localhost:11434"

    # Opik tracing
    opik_enabled: bool = True
    opik_api_key: str = ""
    opik_project_name: str = "nxflix-jlpt-n1"

    # TTS settings
    tts_provider: Literal["google", "openai", "elevenlabs"] = "openai"
    elevenlabs_api_key: str = ""

    def get_model_string(self, provider: str | None = None, model: str | None = None) -> str:
        """Get the LiteLLM model string for a given provider and model."""
        provider = provider or self.default_provider
        model = model or self.default_model

        # LiteLLM model string format
        provider_prefixes = {
            "openai": "openai",
            "anthropic": "anthropic",
            "gemini": "gemini",
            "ollama": "ollama",
        }

        prefix = provider_prefixes.get(provider, provider)
        return f"{prefix}/{model}"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Convenience singleton
settings = get_settings()
