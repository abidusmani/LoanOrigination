# Mini Loan Origination System (LOS)

FastAPI backend + React frontend implementing a mini Loan Origination System with authentication, workflow processing, and an admin dashboard.




## Features

- User registration and login (JWT-based)
- Role-based access control: `user` vs `admin`
- Loan application workflow with steps:
  - Onboarding → KYC → Credit Check → Eligibility
- Admin dashboard to view applications and stats
- Swagger API docs at `/docs`

## Workflow & Business Rules

Workflow states:

```
DRAFT → KYC_PENDING → KYC_COMPLETED → CREDIT_CHECK_PENDING → CREDIT_CHECK_COMPLETED → ELIGIBLE / NOT_ELIGIBLE
```

Key rules:

-PAN 5th letter must be eqaul to 1st letter of Second name
- KYC name match score ≥ 80 → KYC_COMPLETED; otherwise → KYC_FAILED 
- Credit score ≥ 650 AND active loans ≤ 5 → CREDIT_CHECK_COMPLETED; otherwise → CREDIT_REJECTED
- Eligibility uses fixed interest (12% p.a.) and tenure (36 months) with income-based EMI caps

## Prerequisites

- Python 3.10+ (Windows: `py` launcher recommended)
- Node.js 18+ (recommended) and npm

## Backend Setup (Windows PowerShell)

```powershell
# 1) Create and activate virtual environment
cd "D:\Full stack assesement\asssesment\Backend"
py -m venv venv
.\venv\Scripts\Activate
python -m pip install --upgrade pip
pip install -r requirements.txt

# 2) Configure environment


# PostgreSQL (requires running DB)
# Set-Content -Path .env -Value @"
# DATABASE_URL=postgresql://postgres:password@localhost:5432/loan_os_db
# CORS_ORIGINS=http://localhost:5173
# "@

# 3) Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Notes:

- Default admin is auto-created on startup: `admin@los.com` / `admin123` (see `Backend/main.py`).
- API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Frontend Setup (Windows PowerShell)

```powershell
# From project root
cd "D:\Full stack assesement\asssesment"
npm install
npm run dev
```

The app will start at http://localhost:5173.

## How to Use

1. Start backend (PowerShell terminal A) using the steps above
2. Start frontend (PowerShell terminal B) with `npm run dev`
3. Open http://localhost:5173 in the browser
4. Login or register:
   - Admin: `admin@los.com` / `admin123` → redirected to `/admin`
   - Normal user: register a new account → redirected to `/`
5. User flow: Onboarding → KYC → Credit Check → Eligibility on the application page
6. Admin flow: View applications and stats on the admin dashboard

## Environment Variables (Backend)

Edit `Backend/.env`:

- `DATABASE_URL`: e.g., `sqlite:///./los.db` or `postgresql://user:pass@host:5432/db`
- `CORS_ORIGINS`: comma-separated origins, e.g., `http://localhost:5173`
- `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` are configurable in `Backend/app/core/config.py`



## Scripts

Frontend:

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview built frontend

Backend:

- `uvicorn main:app --reload` — start FastAPI with auto-reload

---

This guide ensures reviewers can quickly set up, understand the flow, and run both backend and frontend locally.
