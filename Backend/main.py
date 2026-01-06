"""
Mini Loan Origination System (LOS) - FastAPI Backend

A comprehensive loan origination system that handles:
- Customer onboarding
- KYC verification
- Credit bureau check (CIBIL)
- Loan eligibility decisioning

Workflow States:
DRAFT → KYC_PENDING → KYC_COMPLETED → CREDIT_CHECK_PENDING → 
CREDIT_CHECK_COMPLETED → ELIGIBLE / NOT_ELIGIBLE
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db import init_db, Base, engine
from app.routes import auth_router, applications_router, admin_router
from app.models.user import User
from app.core.security import get_password_hash


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler
    Initializes database and creates default admin user on startup
    """
    # Startup
    print("🚀 Starting Loan Origination System...")
    
    # Initialize database tables
    print("📦 Initializing database...")
    Base.metadata.create_all(bind=engine)
    
    # Create default admin user if not exists
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@los.com").first()
        if not admin:
            admin = User(
                email="admin@los.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("👤 Default admin user created (admin@los.com / admin123)")
        else:
            print("👤 Admin user already exists")
    finally:
        db.close()
    
    print("✅ Application started successfully!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title="Loan Origination System API",
    description="""
## Mini Loan Origination System (LOS)

A comprehensive loan origination system with workflow-driven processing.

### Features:
- **Customer Onboarding**: Capture applicant details with validation
- **KYC Verification**: Rule-based KYC verification (mock)
- **Credit Check**: CIBIL credit bureau integration (mock)
- **Eligibility Engine**: Loan eligibility calculation

### Workflow States:
```
DRAFT → KYC_PENDING → KYC_COMPLETED → CREDIT_CHECK_PENDING → 
CREDIT_CHECK_COMPLETED → ELIGIBLE / NOT_ELIGIBLE
```

### Terminal States:
- `KYC_FAILED` - KYC verification failed
- `CREDIT_REJECTED` - Credit check failed
- `ELIGIBLE` - Approved for loan
- `NOT_ELIGIBLE` - Not eligible for requested amount
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle unhandled exceptions"""
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "type": type(exc).__name__}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(applications_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "Loan Origination System API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# API info endpoint
@app.get("/api")
async def api_info():
    """API information"""
    return {
        "name": "Loan Origination System API",
        "version": "1.0.0",
        "endpoints": {
            "auth": {
                "register": "POST /api/auth/register",
                "login": "POST /api/auth/login",
                "me": "GET /api/auth/me",
            },
            "applications": {
                "create": "POST /api/applications",
                "list": "GET /api/applications",
                "get": "GET /api/applications/{id}",
                "kyc": "POST /api/applications/{id}/kyc",
                "credit_check": "POST /api/applications/{id}/credit-check",
                "eligibility": "POST /api/applications/{id}/eligibility",
            },
            "admin": {
                "stats": "GET /api/admin/stats",
                "applications": "GET /api/admin/applications",
                "journey": "GET /api/admin/applications/{id}/journey",
            },
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
