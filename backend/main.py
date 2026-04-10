import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

from backend.routers import user, admin, auth


def validate_required_env() -> None:
    jwt_secret = os.getenv("JWT_SECRET_KEY", "").strip()
    if not jwt_secret:
        raise ValueError("JWT_SECRET_KEY environment variable is not set.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_required_env()
    # Startup: Load ML models or connect to DB here if needed
    print("Backend started")
    from backend.services.ml_service import get_model_and_scaler
    # Attempt to preload ML models at startup to catch errors early
    get_model_and_scaler()
    
    yield
    # Shutdown: Clean up resources
    print("Backend shutting down")

app = FastAPI(
    title="Mindscan AI API",
    description="Backend for Mindscan AI Survey & Recommendation System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup for allowing requests from the frontend landing page
# Frontend runs on port 3000 (package.json --port=3000) but geminiService.ts calls port 8080;
# Add both common ports so both dev server configs can reach the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(admin.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Mindscan AI API. Documentation available at /docs"}
