from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, hash_password, verify_password, verify_token
from ..database import get_db
from ..models import User
from ..schemas import AuthTokenResponse, LoginRequest, MeResponse, RegisterRequest


router = APIRouter(prefix="/api/auth", tags=["Auth Endpoints"])


@router.post("/register", response_model=MeResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    existing = await db.execute(select(User).filter(User.email == normalized_email))
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Email already registered")

    new_user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    result = await db.execute(select(User).filter(User.email == normalized_email))
    user = result.scalars().first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        {
            "sub": user.email,
            "uid": user.user_id,
            "name": user.name,
            "role": "user",
        },
        expires_delta=expires_delta,
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_seconds": int(expires_delta.total_seconds()),
    }


@router.get("/me", response_model=MeResponse)
async def me(payload: dict = Depends(verify_token), db: AsyncSession = Depends(get_db)):
    uid = payload.get("uid")
    if uid is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(select(User).filter(User.user_id == uid))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
