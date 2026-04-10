from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Session, Response, Prediction, Recommendation
from ..schemas import SessionResponse, SurveyInput, SurveySubmissionResponse, HistoryResponse, RecommendationResponse
from ..services.ml_service import predict_stress
from ..services.recommendation_service import generate_recommendations

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
    # 1. Verify session exists (read-only; no transaction side effects required)
    result = await db.execute(select(Session).filter(Session.session_id == session_id))
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    rec_objects: list[Recommendation] = []

    try:
        # 2. ML inference + 3. DB writes: single atomic unit (commit only if all succeed)
        ml_result = predict_stress(survey.model_dump())
        stress_level = ml_result["stress_level"]
        confidence_score = ml_result["confidence_score"]

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
            confidence_score=confidence_score
        )
        db.add(prediction)
        await db.flush()

        rec_data = generate_recommendations(survey.model_dump(), stress_level)
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
        await db.refresh(prediction)

    except HTTPException:
        await db.rollback()
        raise
    except RuntimeError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error while saving the survey prediction.",
        ) from e
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving prediction: {str(e)}",
        ) from e
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction pipeline failed: {str(e)}",
        ) from e

    return {
        "session_id": session_id,
        "prediction": {
            "pred_id": prediction.pred_id,
            "stress_level": prediction.stress_level,
            "confidence_score": prediction.confidence_score,
            "feature_importance": ml_result.get("feature_importance", {}),
            "feature_contributions": ml_result.get("feature_contributions", []),
            "recommendations": rec_objects
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
