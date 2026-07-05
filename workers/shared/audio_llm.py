"""Transcribe and summarize audio via OpenRouter-compatible APIs."""

from __future__ import annotations

import json
import logging
import os
import re
import tempfile

import httpx

logger = logging.getLogger(__name__)


def _api_url() -> str:
    return (os.getenv("AUDIO_API_URL") or os.getenv("VISION_API_URL") or os.getenv("QWEN_API_URL", "")).rstrip("/")


def _api_key() -> str:
    return os.getenv("AUDIO_API_KEY") or os.getenv("VISION_API_KEY") or os.getenv("QWEN_API_KEY", "")


def _transcribe_model() -> str:
    return os.getenv("AUDIO_TRANSCRIBE_MODEL", "openai/whisper-1")


def _summary_model() -> str:
    return os.getenv("AUDIO_MODEL", os.getenv("VISION_SYNTH_MODEL", "openai/gpt-4o-mini"))


def _transcribe(audio_bytes: bytes, filename: str) -> str:
    url = _api_url()
    key = _api_key()
    if not url or not key:
        raise RuntimeError("AUDIO_API_URL and AUDIO_API_KEY (or VISION_*/QWEN_*) must be set")

    suffix = ".webm" if filename.endswith(".webm") else ".mp3"
    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(audio_bytes)
        with open(path, "rb") as audio_file:
            response = httpx.post(
                f"{url}/audio/transcriptions",
                headers={"Authorization": f"Bearer {key}"},
                data={"model": _transcribe_model()},
                files={"file": (filename or f"audio{suffix}", audio_file, "application/octet-stream")},
                timeout=180.0,
            )
        response.raise_for_status()
        data = response.json()
        if isinstance(data, dict) and data.get("text"):
            return str(data["text"]).strip()
        return str(data).strip()
    finally:
        if os.path.exists(path):
            os.unlink(path)


def _summarize_transcript(
    transcript: str,
    *,
    sport: str,
    athlete_name: str | None,
    session_title: str | None,
    description: str | None,
) -> dict:
    url = _api_url()
    key = _api_key()
    athlete = athlete_name or "the athlete"
    prompt = f"""Summarize this {sport} session audio for coach memory.

Athlete: {athlete}
Session: {session_title or "training"}
Context: {description or "none"}

Transcript:
{transcript[:6000]}

Respond with ONLY valid JSON:
{{"summary": "3-5 sentences", "observations": ["..."], "entities": ["sport:{sport}", "..."]}}"""

    response = httpx.post(
        f"{url}/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={
            "model": _summary_model(),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 1200,
        },
        timeout=120.0,
    )
    response.raise_for_status()
    raw = response.json()["choices"][0]["message"]["content"].strip()
    try:
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            data = json.loads(match.group())
            return {
                "transcript": transcript[:4000],
                "summary": str(data.get("summary", transcript[:500])),
                "observations": data.get("observations") or [],
                "entities": data.get("entities") or [f"sport:{sport}"],
            }
    except json.JSONDecodeError:
        logger.warning("Audio summary JSON parse failed")
    return {
        "transcript": transcript[:4000],
        "summary": transcript[:2000] if len(transcript) < 2000 else transcript[:2000] + "...",
        "observations": [],
        "entities": [f"sport:{sport}"],
    }


def analyze_audio(
    audio_bytes: bytes,
    *,
    filename: str,
    sport: str,
    athlete_name: str | None,
    session_title: str | None,
    description: str | None,
) -> dict:
    transcript = _transcribe(audio_bytes, filename)
    if not transcript:
        return {
            "transcript": "",
            "summary": f"Audio recorded for {session_title or 'session'} ({sport}); no speech detected.",
            "observations": [],
            "entities": [f"sport:{sport}"],
        }
    return _summarize_transcript(
        transcript,
        sport=sport,
        athlete_name=athlete_name,
        session_title=session_title,
        description=description,
    )
