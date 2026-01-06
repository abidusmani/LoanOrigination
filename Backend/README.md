# Mini Loan Origination System - Backend

A FastAPI-based backend for the Mini Loan Origination System (LOS).

## Features

- **Customer Onboarding** - Capture and validate applicant details
- **KYC Verification** - Rule-based mock KYC service
- **Credit Check** - Mock CIBIL credit bureau integration
- **Eligibility Engine** - Loan eligibility calculation
- **Workflow Engine** - State machine for application processing
- **Admin Dashboard API** - Application management and statistics

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens
- **Validation**: Pydantic

## Project Structure

```
Backend/
├── main.py                 # Application entry point
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
├── app/
│   ├── core/
│   │   ├── config.py       # Application settings
│   │   ├── constants.py    # Workflow states & enums
│   │   └── security.py     # JWT & password handling
│   ├── db/
│   │   └── database.py     # Database configuration
│   ├── models/
│   │   ├── user.py         # User model
│   │   └── application.py  # Application model
│   ├── schemas/
│   │   ├── user.py         # User Pydantic schemas
│   │   └── application.py  # Application Pydantic schemas
│   ├── services/
│   │   ├── base.py         # Base service interface
│   │   ├── kyc_service.py  # KYC verification service
│   │   ├── credit_service.py # Credit bureau service
│   │   ├── eligibility_service.py # Eligibility engine
│   │   └── workflow_engine.py # Workflow state machine
│   └── routes/
│       ├── auth.py         # Authentication endpoints
│       ├── applications.py # Application endpoints
│       └── admin.py        # Admin endpoints
```

## Setup

### 1. Create Virtual Environment

```bash
cd Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Database

Create a PostgreSQL database and update `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/loan_os_db
```

### 4. Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Workflow States

```
DRAFT → KYC_PENDING → KYC_COMPLETED → CREDIT_CHECK_PENDING →
CREDIT_CHECK_COMPLETED → ELIGIBLE / NOT_ELIGIBLE
```

### Terminal States

- `KYC_FAILED` - KYC verification failed (nameMatchScore < 80)
- `CREDIT_REJECTED` - Credit check failed (score < 650 or loans > 5)
- `ELIGIBLE` - Approved for loan
- `NOT_ELIGIBLE` - Not eligible for requested amount

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with OAuth2 form
- `POST /api/auth/login/json` - Login with JSON body
- `GET /api/auth/me` - Get current user

### Applications

- `POST /api/applications` - Create application (onboarding)
- `GET /api/applications` - List applications
- `GET /api/applications/{id}` - Get application details
- `POST /api/applications/{id}/kyc` - Initiate KYC verification
- `POST /api/applications/{id}/credit-check` - Initiate credit check
- `POST /api/applications/{id}/eligibility` - Calculate eligibility

### Admin

- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/applications` - List all applications with filters
- `GET /api/admin/applications/{id}` - Get application details
- `GET /api/admin/applications/{id}/journey` - Get full journey log

## Business Rules

### Onboarding Validations

- PAN format: `ABCDE1234F`
- Age: ≥ 21 years
- Loan amount: ≤ 20x monthly income
- Mobile: 10 digits starting with 6-9

### KYC Rules

- Name match score ≥ 80 → KYC_COMPLETED
- Name match score < 80 → KYC_FAILED

### Credit Check Rules

- Credit score ≥ 650 AND active loans ≤ 5 → CREDIT_CHECK_COMPLETED
- Otherwise → CREDIT_REJECTED

### Eligibility Rules

- Salaried: Max EMI = 50% of monthly income
- Self-Employed: Max EMI = 40% of monthly income
- Interest Rate: 12% p.a.
- Tenure: 36 months

## Default Admin Account

- Email: `admin@los.com`
- Password: `admin123`

## License

MIT
