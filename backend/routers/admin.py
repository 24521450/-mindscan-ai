import csv
from io import StringIO
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from ..database import get_db
from ..models import Session, Response, Prediction
from ..auth import verify_token
from ..schemas import AdminStatsResponse

# This router requires a valid JWT for all endpoints
router = APIRouter(prefix="/api/admin", tags=["Admin Endpoints"], dependencies=[Depends(verify_token)])

@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Total sessions
    sessions_count = await db.scalar(select(func.count(Session.session_id)))
    # Total predictions
    preds_count = await db.scalar(select(func.count(Prediction.pred_id)))
    # High stress count (assuming stress_level == 2 is high)
    high_stress_count = await db.scalar(select(func.count(Prediction.pred_id)).filter(Prediction.stress_level == 2))

    high_stress_rate = 0.0
    if preds_count and preds_count > 0:
        high_stress_rate = (high_stress_count / preds_count) * 100

    return {
        "total_sessions": sessions_count or 0,
        "total_predictions": preds_count or 0,
        "high_stress_rate": round(high_stress_rate, 2)
    }

@router.get("/export")
async def export_data(db: AsyncSession = Depends(get_db)):
    # Fetch responses and their predictions
    result = await db.execute(
        select(Response, Prediction)
        .outerjoin(Prediction, Response.response_id == Prediction.response_id)
    )
    records = result.all()

    # Create an in-memory CSV file
    csv_file = StringIO()
    writer = csv.writer(csv_file)
    
    # Write Headers — must match current Response model columns exactly
    headers = [
        "response_id", "session_id", "age", "gender",
        "anxiety_level", "self_esteem", "mental_health_history", "depression",
        "headache", "blood_pressure", "sleep_quality", "breathing_problem",
        "noise_level", "living_conditions", "safety", "basic_needs",
        "academic_performance", "study_load", "teacher_student_relationship",
        "future_career_concerns", "social_support", "peer_pressure",
        "extracurricular_activities", "bullying",
        "stress_level", "confidence_score"
    ]
    writer.writerow(headers)

    # Write Data Rows
    for r, p in records:
        writer.writerow([
            r.response_id,
            r.session_id,
            r.age,
            r.gender,
            r.anxiety_level,
            r.self_esteem,
            r.mental_health_history,
            r.depression,
            r.headache,
            r.blood_pressure,
            r.sleep_quality,
            r.breathing_problem,
            r.noise_level,
            r.living_conditions,
            r.safety,
            r.basic_needs,
            r.academic_performance,
            r.study_load,
            r.teacher_student_relationship,
            r.future_career_concerns,
            r.social_support,
            r.peer_pressure,
            r.extracurricular_activities,
            r.bullying,
            p.stress_level if p else None,
            p.confidence_score if p else None
        ])

    csv_file.seek(0)
    
    return StreamingResponse(
        iter([csv_file.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mindscan_export.csv"}
    )
