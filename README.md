```
# 🧠 Mindscan AI — Student Mental Wellness Survey & Recommendation System

> A full-stack AI-powered web application that analyzes student stress levels from survey inputs and delivers personalized mental wellness recommendations.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Project Architecture](#project-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Start the Backend (FastAPI)](#1-start-the-backend-fastapi)
  - [2. Start the Frontend (React/Vite)](#2-start-the-frontend-reactvite)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [AI Model Details](#ai-model-details)
- [Troubleshooting](#troubleshooting)

---

## Overview

Mindscan AI is a mental wellness platform designed for students. It collects survey data about a student's academic habits, lifestyle, and personal factors, then uses a trained **XGBoost** machine learning model to predict their stress level and return a personalized set of wellness recommendations.

---

## Project Architecture

```
┌──────────────────────┐         ┌─────────────────────────────┐
│   React Frontend     │  HTTP   │      FastAPI Backend         │
│   (Vite + TS)        │ ──────► │   /api/session (POST)        │
│   localhost:3000     │         │   /api/predict  (POST)       │
│                      │ ◄────── │   /api/recommend (GET)       │
└──────────────────────┘  JSON   │   /api/history  (GET)        │
                                 └─────────────────────────────┘
                                              │
                                 ┌────────────▼────────────┐
                                 │   SQLite Database        │
                                 │   + XGBoost ML Model     │
                                 └─────────────────────────┘
```

---

## Tech Stack

| Layer       | Technology                                              |
|-------------|--------------------------------------------------------|
| Frontend    | React 19, TypeScript, Vite 6, Tailwind CSS v4          |
| UI/UX       | Lucide React, Recharts, Motion (Framer)                |
| Backend     | Python, FastAPI, Uvicorn                               |
| Database    | SQLite (via SQLAlchemy async + aiosqlite)              |
| ML Model    | XGBoost, scikit-learn, joblib, pandas                  |
| Auth        | JWT (PyJWT) for Admin routes                           |
| AI          | Google Gemini API (`@google/genai`)                    |

---

## Project Structure

```
mindscan-ai-landing-page/
├── backend/
│   ├── main.py               # FastAPI app entrypoint, CORS, lifespan
│   ├── database.py           # SQLAlchemy async engine & session
│   ├── models.py             # ORM models (Session, Response, Prediction, Recommendation)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # JWT authentication utilities
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Backend environment variables (not committed)
│   ├── routers/
│   │   ├── user.py           # User-facing API routes
│   │   └── admin.py          # Admin-only API routes
│   └── services/
│       ├── ml_service.py     # XGBoost model loading & stress prediction
│       └── recommendation_service.py  # Rule-based recommendation engine
├── src/
│   ├── App.tsx               # Main React application & all page components
│   ├── main.tsx              # React entry point
│   ├── index.css             # Global styles
│   └── services/             # API service layer (axios/fetch wrappers)
├── scaler.pkl                # Pre-trained StandardScaler artifact
├── xgboost_stress_model.pkl  # Pre-trained XGBoost model
├── mindscan_ai.db            # SQLite database (auto-created on first run)
├── index.html                # HTML shell for Vite
├── package.json              # Node dependencies & scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── .env.example              # Frontend environment variable template
```

---

## Prerequisites

Make sure the following are installed on your machine before proceeding:

- **Python** ≥ 3.10
- **Node.js** ≥ 18 (with `npm`)
- **Git** (optional, for cloning)

---

## Getting Started

You need **two terminal windows** running simultaneously — one for the backend and one for the frontend.

### 1. Start the Backend (FastAPI)

Open your first terminal and run the following commands from the project root:

**Step 1 — Create and activate a virtual environment:**
```bash
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate
```

**Step 2 — Install Python dependencies:**
```bash
pip install -r backend/requirements.txt
```

**Step 3 — Configure backend environment:**

Copy or create `backend/.env` with the following content:
```env
DATABASE_URL=sqlite+aiosqlite:///./mindscan_ai.db
JWT_SECRET_KEY=your-super-secret-key-here
```

**Step 4 — Start the Uvicorn server:**
```bash
uvicorn backend.main:app --port 8080 --reload
```

The backend API will be available at:
- **API Root:** http://localhost:8080
- **Swagger Docs (Interactive):** http://localhost:8080/docs
- **ReDoc:** http://localhost:8080/redoc

---

### 2. Start the Frontend (React/Vite)

Open a **second terminal** and run the following from the project root:

**Step 1 — Install Node dependencies:**
```bash
npm install
```

**Step 2 — Start the development server:**
```bash
npm run dev
```

The frontend will be available at: **http://localhost:3000**

> ⚠️ **Important:** Ensure the backend is running on port `8080` before using the frontend, as all survey submissions and predictions depend on a live backend connection.

---

## API Endpoints

### User Endpoints

| Method | Endpoint                    | Description                                      |
|--------|-----------------------------|--------------------------------------------------|
| `POST` | `/api/session`              | Create a new anonymous user session              |
| `POST` | `/api/predict?session_id=…` | Submit survey data and get stress prediction     |
| `GET`  | `/api/recommend/{pred_id}`  | Fetch recommendations for a given prediction ID  |
| `GET`  | `/api/history/{session_id}` | Retrieve full prediction history for a session   |

### Admin Endpoints (JWT required)

All admin endpoints require a `Bearer <token>` header.

| Method | Endpoint            | Description                                      |
|--------|---------------------|--------------------------------------------------|
| `GET`  | `/api/admin/stats`  | Get aggregate stats (sessions, predictions, high-stress rate) |
| `GET`  | `/api/admin/export` | Export all responses & predictions as a CSV file |

> Full interactive documentation available at **[http://localhost:8080/docs](http://localhost:8080/docs)** when the server is running.

---

## Environment Variables

### Backend — `backend/.env`

| Variable         | Description                              | Default                                      |
|------------------|------------------------------------------|----------------------------------------------|
| `DATABASE_URL`   | SQLAlchemy async connection string       | `sqlite+aiosqlite:///./mindscan_ai.db`       |
| `JWT_SECRET_KEY` | Secret key used to sign JWT tokens       | *(required, set a strong random string)*     |

### Frontend — `.env` (root)

Copy `.env.example` to `.env` in the project root and fill in your values.

| Variable         | Required | Description                                                                 |
|------------------|----------|-----------------------------------------------------------------------------|
| `GEMINI_API_KEY` | Optional | Google Gemini API key. If omitted, the app falls back to the FastAPI backend only. Get one at [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

## AI Model Details

The stress prediction pipeline works as follows:

1. **Survey Input:** The user completes a survey with ~13 data points (age, gender, CGPA, sleep hours, study hours, social/physical activity level, academic pressure, financial stress, mental health history, etc.)
2. **Feature Scaling:** The backend maps the 13 inputs to the full 20-feature vector the model was trained on, applying sensible default baselines for the remaining fields.
3. **Prediction:** The scaled feature vector is fed into `xgboost_stress_model.pkl` (loaded via `joblib`) using a pre-fitted `scaler.pkl` (StandardScaler).
4. **Output:** The model returns a **stress level** classification and a **confidence score**.
5. **Recommendations:** A rule-based engine (`recommendation_service.py`) uses the stress level and survey inputs to generate categorized wellness recommendations.

**Model artifacts:**
- `scaler.pkl` — Pre-fitted StandardScaler
- `xgboost_stress_model.pkl` — Trained XGBoost classifier (~1 MB)

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `CORS error` in browser console | Frontend port not in CORS allow-list | Make sure backend has your frontend port (`3000` or `5173`) in `main.py` CORS origins |
| `503 Service Unavailable` on `/api/predict` | `.pkl` model files not found | Ensure `xgboost_stress_model.pkl` and `scaler.pkl` exist in the **project root** (not inside `backend/`) |
| `ModuleNotFoundError` when starting uvicorn | Running from wrong directory or venv not active | Run `uvicorn backend.main:app ...` from the **project root**, with venv activated |
| Frontend shows "Lỗi kết nối" fallback | Backend not running or wrong port | Start the backend first with `uvicorn backend.main:app --port 8080 --reload` |
| `422 Unprocessable Entity` on predict | GPA value > 4.0 sent by client | The backend now enforces `cgpa ≤ 4.0`; check that the frontend sends a valid GPA |

---

*Built with ❤️ for student mental wellness.*
