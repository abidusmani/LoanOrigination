"""
Admin Routes
Handles admin dashboard operations
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models.application import Application
from app.schemas.application import ApplicationResponse, PaginatedResponse, ApplicationListResponse
from app.core.constants import WorkflowState
from app.core.security import get_current_user_optional


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Get dashboard statistics
    
    Returns counts for:
    - Total applications
    - Eligible applications
    - Not eligible applications
    - Pending applications
    - Failed applications (KYC failed + Credit rejected)
    """
    # Total applications
    total = db.query(func.count(Application.id)).scalar()
    
    # Eligible
    eligible = db.query(func.count(Application.id)).filter(
        Application.status == WorkflowState.ELIGIBLE
    ).scalar()
    
    # Not eligible
    not_eligible = db.query(func.count(Application.id)).filter(
        Application.status == WorkflowState.NOT_ELIGIBLE
    ).scalar()
    
    # Pending (not in terminal states)
    pending = db.query(func.count(Application.id)).filter(
        Application.status.notin_([
            WorkflowState.ELIGIBLE,
            WorkflowState.NOT_ELIGIBLE,
            WorkflowState.KYC_FAILED,
            WorkflowState.CREDIT_REJECTED,
        ])
    ).scalar()
    
    # Failed (KYC failed + Credit rejected)
    failed = db.query(func.count(Application.id)).filter(
        Application.status.in_([
            WorkflowState.KYC_FAILED,
            WorkflowState.CREDIT_REJECTED,
        ])
    ).scalar()
    
    # Status breakdown
    status_breakdown = {}
    for state in WorkflowState:
        count = db.query(func.count(Application.id)).filter(
            Application.status == state
        ).scalar()
        status_breakdown[state.value] = count
    
    return {
        "total": total,
        "eligible": eligible,
        "not_eligible": not_eligible,
        "pending": pending,
        "failed": failed,
        "status_breakdown": status_breakdown,
    }


@router.get("/applications", response_model=PaginatedResponse)
async def list_all_applications(
    status: Optional[WorkflowState] = Query(None, description="Filter by status"),
    eligibility: Optional[str] = Query(None, description="Filter by eligibility"),
    search: Optional[str] = Query(None, description="Search by name, PAN, or application ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    List all applications for admin view
    
    Supports filtering and search.
    """
    query = db.query(Application)
    
    # Apply status filter
    if status:
        query = query.filter(Application.status == status)
    
    # Apply eligibility filter
    if eligibility == "eligible":
        query = query.filter(Application.status == WorkflowState.ELIGIBLE)
    elif eligibility == "not_eligible":
        query = query.filter(Application.status == WorkflowState.NOT_ELIGIBLE)
    elif eligibility == "pending":
        query = query.filter(
            Application.status.notin_([
                WorkflowState.ELIGIBLE,
                WorkflowState.NOT_ELIGIBLE,
                WorkflowState.KYC_FAILED,
                WorkflowState.CREDIT_REJECTED,
            ])
        )
    elif eligibility == "failed":
        query = query.filter(
            Application.status.in_([
                WorkflowState.KYC_FAILED,
                WorkflowState.CREDIT_REJECTED,
            ])
        )
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Application.full_name.ilike(search_term)) |
            (Application.pan.ilike(search_term)) |
            (Application.application_id.ilike(search_term)) |
            (Application.mobile.ilike(search_term))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    offset = (page - 1) * page_size
    applications = query.order_by(Application.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=[ApplicationListResponse.model_validate(app) for app in applications],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
async def get_application_detail(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Get detailed application information including full journey log
    """
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found"
        )
    
    return application


@router.get("/applications/{application_id}/journey")
async def get_application_journey(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Get application journey log with all API responses
    """
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found"
        )
    
    return {
        "application_id": application.application_id,
        "current_status": application.status.value,
        "journey_log": application.journey_log or [],
        "kyc_result": application.kyc_result,
        "credit_result": application.credit_result,
        "eligibility_result": application.eligibility_result,
    }
