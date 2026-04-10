from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Session, Response, Prediction, Recommendation, User
from ..schemas import SessionResponse, SurveyInput, SurveySubmissionResponse, HistoryResponse, RecommendationResponse, UserHistoryPredictionResponse
from ..services.ml_service import predict_stress
from ..services.recommendation_service import generate_recommendations
from ..auth import verify_optional_token, verify_token
import json

router = APIRouter(prefix="/api", tags=["User Endpoints"])

@router.post("/session", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    token_payload: dict | None = Depends(verify_optional_token),
    db: AsyncSession = Depends(get_db),
):
    user_id = token_payload.get("uid") if token_payload else None
    new_session = Session(user_id=user_id)
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session

@router.post("/predict", response_model=SurveySubmissionResponse)
async def submit_survey_and_predict(session_id: str, survey: SurveyInput, db: AsyncSession = Depends(get_db)):
    # 1. Get predictions from ML service first (no DB writes yet)
    try:
        ml_result = predict_stress(survey.model_dump())
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    stress_level = ml_result["stress_level"]
    confidence_score = ml_result["confidence_score"]
    model_version = ml_result.get("model_version", "v1.0.0-legacy")
    rec_data = generate_recommendations(survey.model_dump(), stress_level)

    try:
        # 2. Verify session + all DB writes happen in one transaction block.
        async with db.begin():
            result = await db.execute(select(Session).filter(Session.session_id == session_id))
            db_session = result.scalars().first()
            if not db_session:
                raise HTTPException(status_code=404, detail="Session not found")

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
            await db.flush()

            prediction = Prediction(
                response_id=new_response.response_id,
                stress_level=stress_level,
                confidence_score=confidence_score,
                model_version=model_version
            )
            db.add(prediction)
            await db.flush()

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

            # Ensure recommendation IDs are generated before response serialization.
            await db.flush()

        return {
            "session_id": session_id,
            "prediction": {
                "pred_id": prediction.pred_id,
                "stress_level": prediction.stress_level,
                "confidence_score": prediction.confidence_score,
                "model_version": prediction.model_version,
                "feature_importance": ml_result.get("feature_importance", {}),
                "feature_contributions": ml_result.get("feature_contributions", []),
                "recommendations": rec_objects
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Predict transaction failed: {str(e)}")


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


@router.get("/user/history", response_model=list[UserHistoryPredictionResponse])
async def get_user_history(
    token_payload: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    uid = token_payload.get("uid")
    if uid is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user_result = await db.execute(select(User).filter(User.user_id == uid))
    if not user_result.scalars().first():
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(Session)
        .options(selectinload(Session.responses).selectinload(Response.prediction).selectinload(Prediction.recommendations))
        .filter(Session.user_id == uid)
        .order_by(Session.created_at.desc())
    )
    sessions = result.scalars().all()

    history: list[dict] = []
    for session in sessions:
        for resp in session.responses:
            if resp.prediction:
                history.append(
                    {
                        "session_id": session.session_id,
                        "created_at": session.created_at,
                        "prediction": resp.prediction,
                    }
                )
    return history
