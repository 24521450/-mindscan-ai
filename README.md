# 🧠 Mindscan AI — Hệ thống Khảo sát & Khuyến nghị Sức khỏe Tâm thần Sinh viên

> Ứng dụng web full-stack sử dụng AI để phân tích mức độ căng thẳng của sinh viên từ dữ liệu khảo sát và đưa ra các khuyến nghị sức khỏe tâm thần được cá nhân hóa.

---

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu cài đặt](#yêu-cầu-cài-đặt)
- [Hướng dẫn khởi động](#hướng-dẫn-khởi-động)
  - [1. Khởi động Backend (FastAPI)](#1-khởi-động-backend-fastapi)
  - [2. Khởi động Frontend (React/Vite)](#2-khởi-động-frontend-reactvite)
- [API Endpoints](#api-endpoints)
- [Database Migrations (Alembic)](#database-migrations-alembic)
- [Biến môi trường](#biến-môi-trường)
- [Chi tiết mô hình AI](#chi-tiết-mô-hình-ai)
- [Xử lý sự cố](#xử-lý-sự-cố)

---

## Tổng quan

Mindscan AI là nền tảng sức khỏe tâm thần được thiết kế cho sinh viên. Hệ thống thu thập dữ liệu khảo sát về thói quen học tập, lối sống và các yếu tố cá nhân, sau đó dùng mô hình học máy **XGBoost** đã được huấn luyện để dự đoán mức độ căng thẳng và trả về các khuyến nghị sức khỏe được cá nhân hóa.

**Tính năng nổi bật:**

- 🌍 Hỗ trợ đa ngôn ngữ: Tiếng Việt, Tiếng Anh, Tiếng Đức, Tiếng Trung
- 🔒 Khảo sát hoàn toàn ẩn danh, không thu thập thông tin cá nhân
- 🤖 Gợi ý AI cá nhân hóa từ Google Gemini API
- 📊 Trực quan hóa mức độ stress theo thời gian thực
- 🚨 Cảnh báo khẩn cấp và kết nối tài nguyên hỗ trợ tâm lý

---

## Kiến trúc hệ thống

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

## Công nghệ sử dụng

| Tầng         | Công nghệ                                               |
|--------------|---------------------------------------------------------|
| Frontend     | React 19, TypeScript, Vite 6, Tailwind CSS v4           |
| UI/UX        | Lucide React, Recharts, Motion (Framer)                 |
| Backend      | Python, FastAPI, Uvicorn                                |
| Cơ sở dữ liệu| SQLite (SQLAlchemy async + aiosqlite)                   |
| Mô hình ML   | XGBoost, scikit-learn, joblib, pandas                   |
| Xác thực     | JWT (PyJWT) cho các route Admin                         |
| AI           | Google Gemini API (`@google/genai`)                     |

---

## Cấu trúc thư mục

```
mindscan-ai-landing-page/
├── backend/
│   ├── main.py                     # Entrypoint FastAPI, CORS, lifespan
│   ├── database.py                 # SQLAlchemy async engine & session
│   ├── models.py                   # ORM models (Session, Prediction...)
│   ├── schemas.py                  # Pydantic request/response schemas
│   ├── auth.py                     # JWT authentication utilities
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Biến môi trường backend (không commit)
│   ├── routers/
│   │   ├── user.py                 # API routes dành cho người dùng
│   │   └── admin.py                # API routes dành cho Admin
│   └── services/
│       ├── ml_service.py           # Tải & dự đoán từ mô hình XGBoost
│       └── recommendation_service.py  # Engine khuyến nghị
├── src/
│   ├── App.tsx                     # Ứng dụng React chính
│   ├── translations.ts             # Từ điển đa ngôn ngữ (vi/en/de/zh)
│   ├── main.tsx                    # Entry point React
│   ├── index.css                   # Global styles
│   └── services/
│       └── geminiService.ts        # Kết nối Google Gemini API
├── scaler.pkl                      # StandardScaler đã huấn luyện
├── xgboost_stress_model.pkl        # Mô hình XGBoost đã huấn luyện (~1MB)
├── mindscan_ai.db                  # SQLite database (tự tạo khi chạy lần đầu)
├── index.html                      # HTML shell cho Vite
├── package.json                    # Node dependencies & scripts
├── vite.config.ts                  # Cấu hình Vite
├── tsconfig.json                   # Cấu hình TypeScript
└── .env.example                    # Mẫu biến môi trường Frontend
```

---

## Yêu cầu cài đặt

Đảm bảo đã cài các phần mềm sau trước khi bắt đầu:

- **Python** ≥ 3.10
- **Node.js** ≥ 18 (kèm `npm`)
- **Git** (tùy chọn, để clone repo)

---

## Hướng dẫn khởi động

Bạn cần **hai cửa sổ terminal** chạy song song — một cho backend và một cho frontend.

### 1. Khởi động Backend (FastAPI)

Mở terminal thứ nhất và chạy từ thư mục gốc của dự án:

**Bước 1 — Tạo và kích hoạt môi trường ảo:**

```bash
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (CMD)
.\venv\Scripts\activate.bat

# macOS / Linux
source venv/bin/activate
```

**Bước 2 — Cài đặt các thư viện Python:**

```bash
pip install -r backend/requirements.txt
```

**Bước 3 — Cấu hình biến môi trường backend:**

Tạo file `backend/.env` với nội dung sau:

```env
DATABASE_URL=sqlite+aiosqlite:///./mindscan_ai.db
JWT_SECRET_KEY=your-super-secret-key-here
```

**Bước 4 — Khởi chạy Database Migrations (Alembic):**

Trước khi khởi động server, bạn cần áp dụng các migration để tạo cơ sở dữ liệu:

```bash
# Áp dụng tất cả pending migrations
alembic upgrade head
```

Lệnh này sẽ tạo tất cả các bảng cần thiết (sessions, responses, predictions, recommendations) từ các model SQLAlchemy, được quản lý qua Alembic migrations.

> **Lưu ý:** Trong lần chạy đầu tiên, nếu chưa có migration, bạn cần tạo bằng:
> ```bash
> alembic revision --autogenerate -m "Initial schema"
> alembic upgrade head
> ```

**Bước 5 — Khởi động server Uvicorn:**

```bash
uvicorn backend.main:app --port 8080 --reload
```

Backend API sẽ khả dụng tại:

- **API Root:** http://localhost:8080
- **Swagger Docs (Tương tác):** http://localhost:8080/docs
- **ReDoc:** http://localhost:8080/redoc

---

### 2. Khởi động Frontend (React/Vite)

Mở **terminal thứ hai** và chạy từ thư mục gốc:

**Bước 1 — Cài đặt Node dependencies:**

```bash
npm install
```

**Bước 2 — Cấu hình biến môi trường frontend:**

Sao chép `.env.example` thành `.env` và điền API key:

```env
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

**Bước 3 — Khởi động development server:**

```bash
npm run dev
```

Frontend sẽ khả dụng tại: **http://localhost:3000**

> ⚠️ **Lưu ý:** Đảm bảo backend đang chạy trên cổng `8080` trước khi sử dụng frontend, vì toàn bộ khảo sát và dự đoán đều phụ thuộc vào kết nối backend.

---

## API Endpoints

### Endpoints dành cho người dùng

| Method | Endpoint                    | Mô tả                                              |
|--------|-----------------------------|----------------------------------------------------|
| `POST` | `/api/session`              | Tạo phiên người dùng ẩn danh mới                   |
| `POST` | `/api/predict?session_id=…` | Gửi dữ liệu khảo sát và nhận kết quả dự đoán stress|
| `GET`  | `/api/recommend/{pred_id}`  | Lấy danh sách khuyến nghị cho một dự đoán          |
| `GET`  | `/api/history/{session_id}` | Xem lịch sử dự đoán của một phiên                  |

### Endpoints dành cho Admin (yêu cầu JWT)

Tất cả các endpoint admin yêu cầu header `Bearer <token>`.

| Method | Endpoint             | Mô tả                                                       |
|--------|----------------------|-------------------------------------------------------------|
| `GET`  | `/api/admin/stats`   | Thống kê tổng hợp (số phiên, dự đoán, tỷ lệ stress cao)   |
| `GET`  | `/api/admin/export`  | Xuất toàn bộ dữ liệu dưới dạng file CSV                    |

> Tài liệu tương tác đầy đủ có tại **[http://localhost:8080/docs](http://localhost:8080/docs)** khi server đang chạy.

---

## Database Migrations (Alembic)

MindScan AI sử dụng **Alembic** để quản lý schema migration cơ sở dữ liệu, đảm bảo version control và tính nhất quán khi nâng cấp dự án.

### Khởi tạo Alembic (lần đầu khi chưa có migrations)

```bash
# Cài đặt alembic (nếu chưa cài)
pip install alembic

# Khởi tạo folder alembic
alembic init alembic
```

### Tạo Migration đầu tiên

```bash
# Auto-generate migration từ models
alembic revision --autogenerate -m "Initial schema"

# Kiểm tra file migration tạo ra trong alembic/versions/
# Đảm bảo các table (sessions, responses, predictions, recommendations) đều có mặt
```

### Áp dụng Migrations

```bash
# Áp dụng tất cả pending migrations
alembic upgrade head

# Kiểm tra migration history
alembic current
alembic history --verbose
```

### Rollback Migrations (khi cần)

```bash
# Rollback về version trước đó
alembic downgrade -1

# Rollback về version cụ thế
alembic downgrade <revision_id>
```

### Quy trình khi thêm Model mới

1. **Thêm model vào** `backend/models.py`
2. **Tạo migration:**
   ```bash
   alembic revision --autogenerate -m "Add new_table structure"
   ```
3. **Kiểm tra file** `alembic/versions/<revision_id>.py` có chính xác không
4. **Áp dụng migration:**
   ```bash
   alembic upgrade head
   ```

---

## Biến môi trường

### Backend — `backend/.env`

| Biến               | Mô tả                                   | Giá trị mặc định                          |
|--------------------|-----------------------------------------|------------------------------------------|
| `DATABASE_URL`     | Chuỗi kết nối SQLAlchemy async          | `sqlite+aiosqlite:///./mindscan_ai.db`   |
| `JWT_SECRET_KEY`   | Khóa bí mật để ký JWT token             | *(bắt buộc, đặt chuỗi ngẫu nhiên mạnh)* |

### Frontend — `.env` (thư mục gốc)

Sao chép `.env.example` thành `.env` và điền giá trị.

| Biến                  | Bắt buộc | Mô tả                                                                                          |
|-----------------------|----------|------------------------------------------------------------------------------------------------|
| `VITE_GEMINI_API_KEY` | Không    | Google Gemini API key. Nếu bỏ trống, app chỉ dùng backend FastAPI. Lấy tại [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

## Chi tiết mô hình AI

Pipeline dự đoán stress hoạt động như sau:

1. **Đầu vào khảo sát:** Người dùng hoàn thành khảo sát với 20 điểm dữ liệu trải qua 5 nhóm (Thông tin cá nhân, Học tập, Tâm lý, Thể chất, Xã hội & Môi trường).
2. **Chuẩn hóa đặc trưng:** Backend ánh xạ 20 đầu vào vào vector đặc trưng mà mô hình đã được huấn luyện, sử dụng `scaler.pkl` (StandardScaler).
3. **Dự đoán:** Vector đặc trưng đã chuẩn hóa được đưa vào `xgboost_stress_model.pkl` (tải qua `joblib`).
4. **Đầu ra:** Mô hình trả về **mức độ stress** (Low / Medium / High) và **điểm tin cậy (confidence)**.
5. **Khuyến nghị:** Engine dựa trên quy tắc (`recommendation_service.py`) dùng mức stress và dữ liệu khảo sát để tạo các khuyến nghị sức khỏe phân loại.

**Các file mô hình:**

- `scaler.pkl` — StandardScaler đã fit sẵn
- `xgboost_stress_model.pkl` — XGBoost classifier đã huấn luyện (~1 MB)

---

## Xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách khắc phục |
|---|---|---|
| Lỗi `CORS` trong console trình duyệt | Cổng frontend không có trong danh sách CORS | Đảm bảo backend có cổng frontend (`3000`) trong `main.py` CORS origins |
| `503 Service Unavailable` tại `/api/predict` | Không tìm thấy file `.pkl` | Đảm bảo `xgboost_stress_model.pkl` và `scaler.pkl` tồn tại ở **thư mục gốc** (không phải trong `backend/`) |
| `ModuleNotFoundError` khi khởi động uvicorn | Chạy sai thư mục hoặc chưa kích hoạt venv | Chạy `uvicorn backend.main:app ...` từ **thư mục gốc**, với venv đã được kích hoạt |
| Frontend hiển thị lỗi kết nối | Backend chưa chạy hoặc sai cổng | Khởi động backend trước với `uvicorn backend.main:app --port 8080 --reload` |
| `422 Unprocessable Entity` tại predict | Dữ liệu đầu vào không hợp lệ | Kiểm tra lại dữ liệu gửi lên có khớp với schema Pydantic không |

---

*Được xây dựng với ❤️ vì sức khỏe tâm thần sinh viên.*
