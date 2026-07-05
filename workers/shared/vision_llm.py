"""OpenRouter vision + synthesis calls for video analysis."""

from __future__ import annotations

import base64
import json
import logging
import os
import re

import httpx

logger = logging.getLogger(__name__)


def _api_url() -> str:
    return (os.getenv("VISION_API_URL") or os.getenv("QWEN_API_URL", "")).rstrip("/")


def _api_key() -> str:
    return os.getenv("VISION_API_KEY") or os.getenv("QWEN_API_KEY", "")


def _vision_model() -> str:
    return os.getenv("VISION_MODEL", "openai/gpt-4o")


def _synth_model() -> str:
    return os.getenv("VISION_SYNTH_MODEL", "openai/gpt-4o-mini")


def _chat(messages: list[dict], model: str, max_tokens: int = 1200) -> str:
    url = _api_url()
    key = _api_key()
    if not url or not key:
        raise RuntimeError("VISION_API_URL and VISION_API_KEY (or QWEN_*) must be set")

    response = httpx.post(
        f"{url}/chat/completions",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": max_tokens,
        },
        timeout=120.0,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


def analyze_image(
    image_bytes: bytes,
    *,
    mime_type: str,
    sport: str,
    athlete_name: str | None,
    session_title: str | None,
    description: str | None,
) -> dict:
    """Analyze a still image and return summary + entities."""
    b64 = base64.standard_b64encode(image_bytes).decode("ascii")
    athlete = athlete_name or "the athlete"
    title = session_title or "training session"
    media_type = mime_type if mime_type.startswith("image/") else "image/jpeg"
    prompt = (
        f"Analyze this {sport} training image for {athlete} (session: {title}). "
        f"Context: {description or 'none'}. "
        "Describe ONLY what is visible: activity, body position, equipment, environment, technique. "
        "Respond as JSON: {\"summary\": \"...\", \"observations\": [\"...\"], \"entities\": [\"sport:...\"]}"
    )
    raw = _chat(
        [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{b64}"}},
                ],
            }
        ],
        model=_vision_model(),
        max_tokens=800,
    )
    return _parse_synthesis_json(raw, sport)


def analyze_frame(
    jpeg_bytes: bytes,
    *,
    sport: str,
    athlete_name: str | None,
    session_title: str | None,
    timestamp_sec: float,
) -> str:
    """Describe a single keyframe; only observable facts."""
    b64 = base64.standard_b64encode(jpeg_bytes).decode("ascii")
    athlete = athlete_name or "the athlete"
    title = session_title or "training session"
    prompt = (
        f"You are analyzing frame {timestamp_sec:.1f}s of a {sport} training video for {athlete} "
        f"(session: {title}). Describe ONLY what is visible: activity, body position, equipment, "
        f"environment, and technique cues. Do not invent scores, speeds, or outcomes. "
        f"Keep to 3-5 sentences."
    )
    return _chat(
        [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    },
                ],
            }
        ],
        model=_vision_model(),
        max_tokens=400,
    )


def synthesize_video_analysis(
    *,
    frame_notes: list[str],
    metadata: dict,
    sport: str,
    athlete_name: str | None,
    session_title: str | None,
    description: str | None,
) -> dict:
    """Merge frame analyses into summary, observations, and entities."""
    athlete = athlete_name or "the athlete"
    notes_block = "\n\n".join(f"Frame {i + 1}: {n}" for i, n in enumerate(frame_notes))
    meta_block = ", ".join(f"{k}={v}" for k, v in metadata.items())
    desc = description or "none"

    prompt = f"""You are a sport performance analyst. Synthesize these keyframe observations into structured memory.

Sport: {sport}
Athlete: {athlete}
Session: {session_title or "training"}
Coach notes: {desc}
Video metadata: {meta_block}

Keyframe observations:
{notes_block}

Respond with ONLY valid JSON (no markdown fences):
{{
  "summary": "3-6 sentence coach-readable narrative",
  "observations": ["bullet 1", "bullet 2"],
  "entities": ["sport:{sport}", "activity:... only if clearly visible"]
}}
Rules: entities must reflect visible activity only; never invent drill names unless seen."""

    raw = _chat([{"role": "user", "content": prompt}], model=_synth_model(), max_tokens=900)
    return _parse_synthesis_json(raw, sport)


def _parse_synthesis_json(raw: str, sport: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
        if isinstance(data, dict) and data.get("summary"):
            obs = data.get("observations") or []
            ents = data.get("entities") or [f"sport:{sport}"]
            return {
                "summary": str(data["summary"]),
                "observations": [str(o) for o in obs] if isinstance(obs, list) else [],
                "entities": [str(e) for e in ents] if isinstance(ents, list) else [f"sport:{sport}"],
            }
    except json.JSONDecodeError:
        logger.warning("Synthesis JSON parse failed, using raw text")
    return {
        "summary": raw[:2000],
        "observations": [],
        "entities": [f"sport:{sport}"],
    }
