from __future__ import annotations

import logging

import httpx

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

COACH_SYSTEM_PROMPT = """You are an elite cricket performance coach assistant for NextPlayAI.
You MUST answer ONLY using the recalled memory context provided below.
If the context does not contain enough information, say "I don't have sufficient memory about that yet."
Never invent statistics, injuries, or performance data not present in the context.
Be concise, actionable, and reference specific evidence from the memories.
Always write in professional coaching language suitable for elite athletes."""


async def generate_coach_answer(question: str, memory_context: str) -> str:
    """
    Generate natural language answer from recalled Cognee context via Qwen (OpenAI-compatible API).
    Falls back to structured context summary if LLM is not configured.
    """
    if not settings.qwen_api_key or not settings.qwen_api_url:
        return _fallback_answer(question, memory_context)

    messages = [
        {"role": "system", "content": COACH_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Recalled Memory Context:\n{memory_context}\n\nCoach Question: {question}",
        },
    ]

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.qwen_api_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.qwen_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.qwen_model,
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 800,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error("Qwen LLM call failed: %s", e)
        return _fallback_answer(question, memory_context)


def _fallback_answer(question: str, memory_context: str) -> str:
    if not memory_context.strip():
        return (
            "I don't have sufficient memory about that yet. "
            "Please seed demo data or upload a cricket session first."
        )
    return (
        f"Based on recalled memories for your question \"{question}\":\n\n"
        f"{memory_context}\n\n"
        f"(Configure QWEN_API_URL and QWEN_API_KEY for full LLM-generated coaching insights.)"
    )
