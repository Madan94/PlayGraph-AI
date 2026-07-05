from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class MemoryType(str, Enum):
    PERFORMANCE_METRIC = "performance_metric"
    COACH_NOTE = "coach_note"
    INJURY = "injury"
    WEARABLE = "wearable"
    TRANSCRIPT = "transcript"
    SESSION_SUMMARY = "session_summary"


class MemoryContent(BaseModel):
    summary: str
    metrics: dict[str, Any] = Field(default_factory=dict)
    entities: list[str] = Field(default_factory=list)


class MemoryEvidence(BaseModel):
    asset_id: str | None = None
    frame_range: list[int] | None = None


class MemoryPayload(BaseModel):
    athlete_id: str
    session_id: str
    sport: str = "unknown"
    athlete_name: str | None = None
    session_title: str | None = None
    description: str | None = None
    asset_filename: str | None = None
    memory_type: MemoryType
    source_worker: str
    content: MemoryContent
    evidence: MemoryEvidence | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    def to_remember_text(self) -> str:
        """Serialize memory for Cognee ingestion with structured context."""
        entities = ", ".join(self.content.entities) if self.content.entities else "none"
        display_metrics = {k: v for k, v in self.content.metrics.items() if not k.startswith("_")}
        metrics = ", ".join(f"{k}={v}" for k, v in display_metrics.items())
        athlete_line = (
            f"Athlete: {self.athlete_name} (ID: {self.athlete_id})"
            if self.athlete_name
            else f"Athlete ID: {self.athlete_id}"
        )
        observations = self.content.metrics.get("_observations")
        obs_block = ""
        if isinstance(observations, list) and observations:
            obs_block = "Observations:\n" + "\n".join(f"- {o}" for o in observations) + "\n"
        return (
            f"[NextPlayAI Memory]\n"
            f"{athlete_line}\n"
            f"Session ID: {self.session_id}\n"
            f"Session: {self.session_title or 'untitled'}\n"
            f"Sport: {self.sport}\n"
            f"Type: {self.memory_type.value}\n"
            f"Source: {self.source_worker}\n"
            f"Asset: {self.asset_filename or 'none'}\n"
            f"Description: {self.description or 'none'}\n"
            f"Timestamp: {self.timestamp.isoformat()}\n"
            f"Summary: {self.content.summary}\n"
            f"{obs_block}"
            f"Metrics: {metrics or 'none'}\n"
            f"Entities: {entities}"
        )


class MemoryRef(BaseModel):
    memory_id: str = Field(default_factory=lambda: str(uuid4()))
    athlete_id: str
    session_id: str
    cognee_dataset: str
    summary: str


class RecallQuery(BaseModel):
    text: str
    athlete_id: str | None = None
    session_id: str | None = None
    limit: int = 10


class RecallSource(BaseModel):
    memory_id: str | None = None
    summary: str
    session_id: str | None = None
    score: float | None = None


class RecallResult(BaseModel):
    query: str
    memories_used: int
    sources: list[RecallSource]
    raw_results: list[Any] = Field(default_factory=list)


class ForgetPolicy(BaseModel):
    athlete_id: str | None = None
    session_id: str | None = None
    older_than_days: int | None = None
    memory_type: MemoryType | None = None


class LifecycleOperation(str, Enum):
    REMEMBER = "remember"
    RECALL = "recall"
    IMPROVE = "improve"
    FORGET = "forget"
    GRAPH_UPDATED = "graph_updated"


class LifecycleEvent(BaseModel):
    op: LifecycleOperation
    message: str
    athlete_id: str | None = None
    session_id: str | None = None
    delta: int | None = None
    count: int | None = None
    nodes: int | None = None
    edges: int | None = None
    at: datetime = Field(default_factory=datetime.utcnow)

    def to_sse(self) -> str:
        import json
        return f"data: {json.dumps(self.model_dump(mode='json'), default=str)}\n\n"
