"""Opik tracing initialization and utilities."""

from functools import lru_cache
from typing import Any

from nxflix_agents.config import get_settings


@lru_cache
def init_tracing() -> Any | None:
    """Initialize Opik tracing if enabled."""
    settings = get_settings()

    if not settings.opik_enabled:
        return None

    try:
        import opik

        opik.configure(
            api_key=settings.opik_api_key if settings.opik_api_key else None,
            project_name=settings.opik_project_name,
        )
        return opik
    except ImportError:
        print("Warning: opik not installed, tracing disabled")
        return None
    except Exception as e:
        print(f"Warning: Failed to initialize Opik: {e}")
        return None


@lru_cache
def get_opik_logger() -> Any | None:
    """Get the Opik logger for LiteLLM callbacks."""
    settings = get_settings()

    if not settings.opik_enabled:
        return None

    try:
        from opik.integrations.litellm import OpikLogger

        return OpikLogger()
    except ImportError:
        return None
    except Exception:
        return None


def track(name: str):
    """Decorator to track function calls with Opik."""
    settings = get_settings()

    def decorator(func):
        if not settings.opik_enabled:
            return func

        try:
            import opik

            return opik.track(name=name)(func)
        except ImportError:
            return func
        except Exception:
            return func

    return decorator
