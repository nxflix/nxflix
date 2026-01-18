"""LiteLLM-based multi-provider LLM abstraction."""

import json
from typing import Any, TypeVar

from pydantic import BaseModel

from nxflix_agents.config import get_settings
from nxflix_agents.tracing import get_opik_logger

T = TypeVar("T", bound=BaseModel)


class LLMProvider:
    """Multi-provider LLM client using LiteLLM."""

    def __init__(
        self,
        provider: str | None = None,
        model: str | None = None,
    ):
        settings = get_settings()
        self.provider = provider or settings.default_provider
        self.model = model or settings.default_model
        self._model_string = settings.get_model_string(self.provider, self.model)

    async def complete(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs: Any,
    ) -> str:
        """Generate a completion from the LLM."""
        from litellm import acompletion

        settings = get_settings()
        callbacks = []

        opik_logger = get_opik_logger()
        if opik_logger:
            callbacks.append(opik_logger)

        # Set provider-specific API keys
        api_key = None
        api_base = None

        if self.provider == "openai":
            api_key = settings.openai_api_key
        elif self.provider == "anthropic":
            api_key = settings.anthropic_api_key
        elif self.provider == "gemini":
            api_key = settings.google_api_key
        elif self.provider == "ollama":
            api_base = settings.ollama_base_url

        response = await acompletion(
            model=self._model_string,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key,
            api_base=api_base,
            callbacks=callbacks if callbacks else None,
            **kwargs,
        )

        return response.choices[0].message.content or ""

    async def complete_json(
        self,
        messages: list[dict[str, str]],
        response_model: type[T],
        temperature: float = 0.3,
        max_tokens: int = 2048,
        **kwargs: Any,
    ) -> T:
        """Generate a structured JSON response from the LLM."""
        schema_json = json.dumps(response_model.model_json_schema(), indent=2)
        system_message = (
            "You must respond with valid JSON that matches this schema:\n"
            f"```json\n{schema_json}\n```\n"
            "Do not include any text before or after the JSON."
        )

        # Prepend system message for JSON mode
        messages_with_system = [{"role": "system", "content": system_message}] + messages

        response = await self.complete(
            messages=messages_with_system,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

        # Parse and validate response
        try:
            # Handle markdown code blocks
            content = response.strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1])

            data = json.loads(content)
            return response_model.model_validate(data)
        except (json.JSONDecodeError, ValueError) as e:
            raise ValueError(f"Failed to parse LLM response as {response_model.__name__}: {e}")


# Convenience functions
async def complete(
    messages: list[dict[str, str]],
    provider: str | None = None,
    model: str | None = None,
    **kwargs: Any,
) -> str:
    """Generate a completion using the default or specified provider."""
    llm = LLMProvider(provider=provider, model=model)
    return await llm.complete(messages, **kwargs)


async def complete_with_json(
    messages: list[dict[str, str]],
    response_model: type[T],
    provider: str | None = None,
    model: str | None = None,
    **kwargs: Any,
) -> T:
    """Generate a structured JSON response using the default or specified provider."""
    llm = LLMProvider(provider=provider, model=model)
    return await llm.complete_json(messages, response_model, **kwargs)
