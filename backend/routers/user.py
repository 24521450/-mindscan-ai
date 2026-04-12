from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Session, Response, Prediction, Recommendation
from ..schemas import SessionResponse, SurveyInput, SurveySubmissionResponse, HistoryResponse, RecommendationResponse
from ..services.ml_service import predict_stress
from ..services.recommendation_service import generate_recommendations
import json

router = APIRouter(prefix="/api", tags=["User Endpoints"])

@router.post("/session", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(db: AsyncSession = Depends(get_db)):
    new_session = Session()
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session

@router.post("/predict", response_model=SurveySubmissionResponse)
async def submit_survey_and_predict(session_id: str, survey: SurveyInput, db: AsyncSession = Depends(get_db)):
    # 1. Verify session exists
    result = await db.execute(select(Session).filter(Session.session_id == session_id))
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 2. Get predictions from ML service
    try:
        ml_result = predict_stress(survey.model_dump())
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) # Service Unavailable if ML errors

    stress_level = ml_result["stress_level"]
    confidence_score = ml_result["confidence_score"]

    # 3. Create database records inside a transaction block
    # Note: Ensure order is correct
    new_response = Response(
        session_id=session_id,
        age=survey.age,
        gender=survey.gender,
        anxiety_level=survey.anxiety_level,
        depression=survey.depression,
        self_esteem=survey.self_esteem,
        mental_health_history=survey.mental_health_history,
        blood_pressure=survey.blood_pressure,
        sleep_quality=survey.sleep_quality,
        headache=survey.headache,
        breathing_problem=survey.breathing_problem,
        study_load=survey.study_load,
        academic_performance=survey.academic_performance,
        teacher_student_relationship=survey.teacher_student_relationship,
        future_career_concerns=survey.future_career_concerns,
        social_support=survey.social_support,
        peer_pressure=survey.peer_pressure,
        extracurricular_activities=survey.extracurricular_activities,
        bullying=survey.bullying,
        noise_level=survey.noise_level,
        living_conditions=survey.living_conditions,
        safety=survey.safety,
        basic_needs=survey.basic_needs
    )
    db.add(new_response)
    await db.flush() # flush to get response_id

    prediction = Prediction(
        response_id=new_response.response_id,
        stress_level=stress_level,
        confidence_score=confidence_score
    )
    db.add(prediction)
    await db.flush() # flush to get pred_id

    # 4. Generate recommendations based on rule engine
    rec_data = generate_recommendations(survey.model_dump(), stress_level)
    rec_objects = []
    
    for r in rec_data:
        reco = Recommendation(
            pred_id=prediction.pred_id,
            category=r["category"],
            title=r["title"],
            description=r["description"]
        )
        db.add(reco)
        rec_objects.append(reco)
        
    await db.commit()
    
    # Reload the inserted data to fully format the response
    await db.refresh(prediction)
    # the relationship won't be hydrated cleanly via await refresh directly on objects without explicit loading,
    # so we manually craft the return using the flushed objects.

    # Build recommendations list with i18n_key from rec_data (DB doesn't store i18n_key)
    recs_response = []
    for reco_obj, reco_data in zip(rec_objects, rec_data):
        recs_response.append({
            "reco_id": reco_obj.reco_id,
            "category": reco_obj.category,
            "i18n_key": reco_data.get("i18n_key"),
            "title": reco_obj.title,
            "description": reco_obj.description,
        })

    return {
        "session_id": session_id,
        "prediction": {
            "pred_id": prediction.pred_id,
            "stress_level": prediction.stress_level,
            "confidence_score": prediction.confidence_score,
            "feature_importance": ml_result.get("feature_importance", {}),
            "feature_contributions": ml_result.get("feature_contributions", []),
            "recommendations": recs_response
        }
    }



@router.get("/recommend/{pred_id}", response_model=list[RecommendationResponse])
async def get_recommendations(pred_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recommendation).filter(Recommendation.pred_id == pred_id))
    recs = result.scalars().all()
    if not recs:
        raise HTTPException(status_code=404, detail="Recommendations not found for this prediction")
    return recs


@router.get("/history/{session_id}") # Will implement dedicated response model mapping if needed
async def get_history(session_id: str, db: AsyncSession = Depends(get_db)):
    # Fetch all Responses and associated Predictions tied to the Session
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.responses).selectinload(Response.prediction).selectinload(Prediction.recommendations))
        .filter(Session.session_id == session_id)
    )
    session_obj = result.scalars().first()
    
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    predictions = []
    for resp in session_obj.responses:
        if resp.prediction:
            predictions.append(resp.prediction)

    return {
        "session_id": session_obj.session_id,
        "created_at": session_obj.created_at,
        "predictions": predictions
    }
