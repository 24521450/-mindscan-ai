import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy import String as CHAR
from sqlalchemy.orm import relationship
from .database import Base

class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sessions")
    responses = relationship("Response", back_populates="session", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = relationship("Session", back_populates="user")


class Response(Base):
    __tablename__ = "responses"

    response_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(CHAR(36), ForeignKey("sessions.session_id"))

    # Survey Features
    age = Column(Integer)
    gender = Column(String(50))
    anxiety_level = Column(Float)
    depression = Column(Float)
    self_esteem = Column(Float)
    mental_health_history = Column(Integer)
    blood_pressure = Column(Integer)
    sleep_quality = Column(Float)
    headache = Column(Float)
    breathing_problem = Column(Float)
    study_load = Column(Float)
    academic_performance = Column(Float)
    teacher_student_relationship = Column(Float)
    future_career_concerns = Column(Float)
    social_support = Column(Float)
    peer_pressure = Column(Float)
    extracurricular_activities = Column(Float)
    bullying = Column(Float)
    noise_level = Column(Float)
    living_conditions = Column(Float)
    safety = Column(Float)
    basic_needs = Column(Float)

    session = relationship("Session", back_populates="responses")
    prediction = relationship("Prediction", back_populates="response", uselist=False, cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    pred_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("responses.response_id"))
    
    stress_level = Column(Integer) # 0: Low, 1: Medium, 2: High
    confidence_score = Column(Float)
    model_version = Column(String(64), nullable=False, default="v1.0.0-legacy")
    
    response = relationship("Response", back_populates="prediction")
    recommendations = relationship("Recommendation", back_populates="prediction", cascade="all, delete-orphan")


class Recommendation(Base):
    __tablename__ = "recommendations"

    reco_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pred_id = Column(Integer, ForeignKey("predictions.pred_id"))
    
    category = Column(String(100))
    title = Column(String(255))
    description = Column(Text)
    
    prediction = relationship("Prediction", back_populates="recommendations")
