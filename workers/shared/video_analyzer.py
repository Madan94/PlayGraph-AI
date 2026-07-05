"""Sport-agnostic video analysis: metadata + vision keyframes."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field

from workers.shared.vision_llm import analyze_frame, synthesize_video_analysis

logger = logging.getLogger(__name__)


@dataclass
class VideoSessionContext:
    sport: str
    athlete_id: str
    session_id: str
    athlete_name: str | None = None
    session_title: str | None = None
    description: str | None = None
    original_filename: str | None = None
    asset_id: str | None = None


@dataclass
class VideoAnalysisResult:
    summary: str
    observations: list[str] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)
    entities: list[str] = field(default_factory=list)


def _max_frames() -> int:
    return max(1, int(os.getenv("VISION_MAX_FRAMES", "10")))


def _extract_metadata(video_path: str) -> dict:
    try:
        import cv2  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError("opencv-python-headless is required for video analysis") from exc

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")

    frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    duration = frames / fps if fps > 0 else 0.0
    cap.release()

    if frames <= 0:
        raise ValueError(f"Video has no frames: {video_path}")

    return {
        "duration_sec": round(duration, 1),
        "frames_total": frames,
        "fps": round(fps, 1),
        "resolution": f"{width}x{height}" if width and height else "unknown",
    }


def _sample_keyframe_jpegs(video_path: str, max_frames: int) -> list[tuple[float, bytes]]:
    try:
        import cv2  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError("opencv-python-headless is required for video analysis") from exc

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")

    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    if total <= 0:
        cap.release()
        return []

    count = min(max_frames, total)
    indices = [int(i * (total - 1) / max(count - 1, 1)) for i in range(count)] if count > 1 else [0]

    samples: list[tuple[float, bytes]] = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ok, frame = cap.read()
        if not ok or frame is None:
            continue
        ok_enc, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        if ok_enc:
            samples.append((idx / fps if fps > 0 else 0.0, buf.tobytes()))

    cap.release()
    return samples


def _metadata_only_result(metadata: dict, context: VideoSessionContext) -> VideoAnalysisResult:
    sport = context.sport or "unknown"
    metrics = {**metadata, "sport": sport}
    summary = (
        f"{sport.title()} video session ({context.session_title or 'training'}): "
        f"{metrics['duration_sec']}s, {metrics['frames_total']} frames at {metrics['fps']} fps, "
        f"resolution {metrics['resolution']}."
    )
    if context.description:
        summary += f" Session notes: {context.description}"
    entities = [f"athlete:{context.athlete_id}", f"sport:{sport}", f"session:{context.session_id}"]
    return VideoAnalysisResult(summary=summary, metrics=metrics, entities=entities)


def analyze_video(video_path: str, context: VideoSessionContext) -> VideoAnalysisResult:
    """OpenCV metadata + vision LLM keyframe analysis."""
    if not video_path:
        raise ValueError("video_path is required")

    metadata = _extract_metadata(video_path)
    sport = (context.sport or "unknown").strip()
    metadata["sport"] = sport

    keyframes = _sample_keyframe_jpegs(video_path, _max_frames())
    if not keyframes:
        return _metadata_only_result(metadata, context)

    frame_notes: list[str] = []
    try:
        for ts, jpeg in keyframes:
            note = analyze_frame(
                jpeg,
                sport=sport,
                athlete_name=context.athlete_name,
                session_title=context.session_title,
                timestamp_sec=ts,
            )
            frame_notes.append(note)
    except Exception as exc:
        logger.error("Vision frame analysis failed: %s", exc)
        result = _metadata_only_result(metadata, context)
        result.summary += " (Vision analysis unavailable — metadata only.)"
        return result

    try:
        synth = synthesize_video_analysis(
            frame_notes=frame_notes,
            metadata=metadata,
            sport=sport,
            athlete_name=context.athlete_name,
            session_title=context.session_title,
            description=context.description,
        )
    except Exception as exc:
        logger.error("Vision synthesis failed: %s", exc)
        result = _metadata_only_result(metadata, context)
        if frame_notes:
            result.summary += " Observations: " + " | ".join(frame_notes[:3])
        return result

    entities = list(synth.get("entities") or [])
    if f"athlete:{context.athlete_id}" not in entities:
        entities.insert(0, f"athlete:{context.athlete_id}")
    if f"sport:{sport}" not in entities:
        entities.append(f"sport:{sport}")
    entities.append(f"session:{context.session_id}")

    metrics = {**metadata, "keyframes_analyzed": len(keyframes)}
    if synth.get("observations"):
        metrics["_observations"] = synth["observations"]

    summary = synth["summary"]
    if context.description:
        summary = f"{summary}\n\nSession notes: {context.description}"

    return VideoAnalysisResult(
        summary=summary,
        observations=synth.get("observations") or [],
        metrics=metrics,
        entities=entities,
    )
