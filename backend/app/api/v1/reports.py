from __future__ import annotations

import io
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.deps import get_lifecycle_service
from backend.app.infrastructure.database import get_db
from backend.app.infrastructure.minio_client import upload_file
from memory.lifecycle import MemoryLifecycleService

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportRequest(BaseModel):
    athlete_id: str
    session_id: str | None = None


def _build_pdf(title: str, sections: list[tuple[str, str]]) -> bytes:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = [
            Paragraph(title, styles["Title"]),
            Spacer(1, 12),
            Paragraph(f"Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]),
            Spacer(1, 24),
        ]
        for heading, body in sections:
            story.append(Paragraph(heading, styles["Heading2"]))
            story.append(Spacer(1, 6))
            for line in body.split("\n"):
                if line.strip():
                    story.append(Paragraph(line.strip(), styles["Normal"]))
                    story.append(Spacer(1, 4))
            story.append(Spacer(1, 16))
        doc.build(story)
        return buffer.getvalue()
    except ImportError:
        # Minimal PDF fallback without reportlab
        content = f"{title}\n\n" + "\n\n".join(f"## {h}\n{b}" for h, b in sections)
        return content.encode("utf-8")


@router.post("/generate")
async def generate_report(
    body: ReportRequest,
    lifecycle: MemoryLifecycleService = Depends(get_lifecycle_service),
    db: AsyncSession = Depends(get_db),
):
    """Generate session report: recall() memories → PDF with evidence."""
    recall = await lifecycle.recall_for_coach(
        body.athlete_id,
        "performance summary injuries coach notes recommendations training timeline progress",
    )

    if not recall.sources:
        raise HTTPException(
            status_code=404,
            detail="No recalled memories for this athlete — upload session data first",
        )

    athlete_row = await db.execute(
        text("SELECT name FROM athletes WHERE id = CAST(:id AS uuid)"),
        {"id": body.athlete_id},
    )
    athlete = athlete_row.first()
    athlete_name = athlete.name if athlete else body.athlete_id

    evidence = "\n".join(f"• {s.summary}" for s in recall.sources)
    sections = [("Recalled Memories (Cognee)", evidence)]

    pdf_bytes = _build_pdf(f"NextPlayAI Session Report — {athlete_name}", sections)
    key = f"reports/{body.athlete_id}/{uuid.uuid4()}.pdf"
    upload_file(key, pdf_bytes, "application/pdf")

    session_id = body.session_id
    if session_id:
        await db.execute(
            text("""
                INSERT INTO reports (session_id, pdf_minio_key)
                VALUES (CAST(:session_id AS uuid), :key)
            """),
            {"session_id": session_id, "key": key},
        )
    await db.execute(
        text("""
            INSERT INTO memory_operations_log (athlete_id, operation, metadata)
            VALUES (CAST(:athlete_id AS uuid), 'recall', CAST(:meta AS jsonb))
        """),
        {
            "athlete_id": body.athlete_id,
            "meta": json.dumps({"report": True, "memories_used": recall.memories_used}),
        },
    )
    await db.commit()

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=nextplay-report.pdf"},
    )
