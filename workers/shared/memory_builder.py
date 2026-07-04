from __future__ import annotations

import re
from typing import Any

from memory.schemas import MemoryContent, MemoryPayload, MemoryType

DEMO_ATHLETE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


def _extract_drill_names(text: str) -> list[str]:
    # lightweight MVP extraction via keyword matching
    drill_vocab = [
        "cover drive",
        "pull shot",
        "front foot",
        "back foot",
        "throwdown",
        "net session",
        "sprint drill",
    ]
    lowered = text.lower()
    return [d for d in drill_vocab if d in lowered]


def extract_audio_signals(transcript: str) -> dict[str, Any]:
    lines = [line.strip() for line in transcript.splitlines() if line.strip()]
    coach_feedback = [
        line for line in lines
        if any(token in line.lower() for token in ["coach", "improve", "focus", "good", "better"])
    ]
    drills = _extract_drill_names(transcript)
    return {
        "transcript": transcript.strip(),
        "coach_feedback": coach_feedback[:6],
        "drill_names": drills,
    }


def extract_image_signals(ocr_text: str) -> dict[str, Any]:
    text = ocr_text.strip()
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    medical_observations = [
        line for line in lines
        if any(token in line.lower() for token in ["injury", "pain", "strain", "swelling", "rehab"])
    ]
    coach_notes = [
        line for line in lines
        if any(token in line.lower() for token in ["coach", "note", "improve", "footwork", "timing"])
    ]

    metrics: dict[str, float] = {}
    for metric, pattern in {
        "runs": r"runs\s*[:=-]?\s*(\d+)",
        "strike_rate": r"strike\s*rate\s*[:=-]?\s*(\d+(?:\.\d+)?)",
        "heart_rate": r"heart\s*rate\s*[:=-]?\s*(\d+(?:\.\d+)?)",
    }.items():
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            metrics[metric] = float(match.group(1))

    return {
        "medical_observations": medical_observations[:6],
        "coach_notes": coach_notes[:6],
        "performance_metrics": metrics,
    }


def build_audio_memory_payload(event: dict[str, Any], transcript: str, source_worker: str = "audio_worker") -> MemoryPayload:
    session_id = event.get("session_id", "unknown")
    athlete_id = event.get("athlete_id", DEMO_ATHLETE_ID)
    asset_id = event.get("asset_id")

    extracted = extract_audio_signals(transcript)
    summary = extracted["transcript"][:220] or "Audio transcript captured"

    entities = [f"athlete:{athlete_id}"]
    entities.extend([f"drill:{d.replace(' ', '_')}" for d in extracted["drill_names"]])

    return MemoryPayload(
        athlete_id=athlete_id,
        session_id=session_id,
        memory_type=MemoryType.TRANSCRIPT,
        source_worker=source_worker,
        content=MemoryContent(
            summary=summary,
            metrics={"feedback_count": len(extracted["coach_feedback"]), "drill_count": len(extracted["drill_names"])},
            entities=entities,
        ),
        evidence={"asset_id": asset_id},
    )


def build_image_memory_payload(event: dict[str, Any], ocr_text: str, source_worker: str = "image_worker") -> MemoryPayload:
    session_id = event.get("session_id", "unknown")
    athlete_id = event.get("athlete_id", DEMO_ATHLETE_ID)
    asset_id = event.get("asset_id")

    extracted = extract_image_signals(ocr_text)
    summary = (
        (extracted["medical_observations"][0] if extracted["medical_observations"] else "")
        or (extracted["coach_notes"][0] if extracted["coach_notes"] else "")
        or ocr_text[:220]
        or "Image observations captured"
    )

    entities = [f"athlete:{athlete_id}"]
    if extracted["medical_observations"]:
        entities.append("medical:observation")
    if extracted["coach_notes"]:
        entities.append("coach:note")

    return MemoryPayload(
        athlete_id=athlete_id,
        session_id=session_id,
        memory_type=MemoryType.COACH_NOTE if extracted["coach_notes"] else MemoryType.INJURY,
        source_worker=source_worker,
        content=MemoryContent(
            summary=summary,
            metrics=extracted["performance_metrics"],
            entities=entities,
        ),
        evidence={"asset_id": asset_id},
    )
