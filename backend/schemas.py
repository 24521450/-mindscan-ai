from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class SessionResponse(BaseModel):
    session_id: str
    user_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class SurveyInput(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: str = Field(..., max_length=50)
    
    anxiety_level: float = Field(..., ge=0, le=21)
    self_esteem: float = Field(..., ge=0, le=30)
    mental_health_history: int = Field(..., ge=0, le=1)
    depression: float = Field(..., ge=0, le=27)
    headache: float = Field(..., ge=0, le=5)
    blood_pressure: int = Field(..., ge=1, le=3)
    sleep_quality: float = Field(..., ge=0, le=5)
    breathing_problem: float = Field(..., ge=0, le=5)
    noise_level: float = Field(..., ge=0, le=5)
    living_conditions: float = Field(..., ge=0, le=5)
    safety: float = Field(..., ge=0, le=5)
    basic_needs: float = Field(..., ge=0, le=5)
    academic_performance: float = Field(..., ge=0, le=5)
    study_load: float = Field(..., ge=0, le=5)
    teacher_student_relationship: float = Field(..., ge=0, le=5)
    future_career_concerns: float = Field(..., ge=0, le=5)
    social_support: float = Field(..., ge=0, le=3)
    peer_pressure: float = Field(..., ge=0, le=5)
    extracurricular_activities: float = Field(..., ge=0, le=5)
    bullying: float = Field(..., ge=0, le=5)

class RecommendationResponse(BaseModel):
    reco_id: int
    category: str
    title: str
    description: str

    class Config:
        from_attributes = True

class FeatureContribution(BaseModel):
    feature: str
    contribution: float
    magnitude: float

class PredictionResponse(BaseModel):
    pred_id: int
    stress_level: int
    confidence_score: float
    model_version: str
    feature_importance: Optional[Dict[str, float]] = None
    feature_contributions: Optional[List[FeatureContribution]] = None
    recommendations: Optional[List[RecommendationResponse]] = []

    class Config:
        from_attributes = True

class SurveySubmissionResponse(BaseModel):
    session_id: str
    prediction: PredictionResponse

class HistoryResponse(BaseModel):
    session_id: str
    created_at: datetime
    predictions: List[PredictionResponse]
    
    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_sessions: int
    total_predictions: int
    high_stress_rate: float


class RegisterRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=120)


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int


class MeResponse(BaseModel):
    user_id: int
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserHistoryPredictionResponse(BaseModel):
    session_id: str
    created_at: datetime
    prediction: PredictionResponse
