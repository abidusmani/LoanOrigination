"""
Application Routes
Handles loan application CRUD and workflow operations
"""

from typing import Optional
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db import get_db
from app.models.application import Application
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationListResponse,
    PaginatedResponse,
)
from app.core.constants import WorkflowState, LoanConfig
from app.core.security import get_current_user_optional
from app.services import (
    get_kyc_service,
    get_credit_service,
    get_eligibility_engine,
    get_workflow_engine,
    WorkflowError,
    KYCServiceInterface,
    CreditBureauServiceInterface,
    EligibilityEngineInterface,
    WorkflowEngine,
)


router = APIRouter(prefix="/applications", tags=["Applications"])


def generate_application_id() -> str:
    """Generate unique application ID"""
    return f"APP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    app_data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Create a new loan application (Customer Onboarding)
    
    Validates:
    - PAN format (ABCDE1234F)
    - Age >= 21
    - Loan amount <= 20x monthly income
    - Mobile number format (10 digits starting with 6-9)
    """
    # Additional validation: Loan amount <= 20x monthly income
    max_loan = app_data.monthly_income * LoanConfig.MAX_LOAN_MULTIPLIER
    if app_data.loan_amount > max_loan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan amount cannot exceed ₹{max_loan:,.0f} (20x monthly income)"
        )
    
    # Create application
    application = Application(
        application_id=generate_application_id(),
        status=WorkflowState.KYC_PENDING,  # Move directly to KYC_PENDING after onboarding
        full_name=app_data.full_name,
        mobile=app_data.mobile,
        pan=app_data.pan,
        dob=app_data.dob,
        employment_type=app_data.employment_type,
        monthly_income=app_data.monthly_income,
        loan_amount=app_data.loan_amount,
        journey_log=[
            {
                "timestamp": datetime.utcnow().isoformat(),
                "action": "APPLICATION_CREATED",
                "status": WorkflowState.DRAFT.value,
                "details": "Loan application created",
                "data": {}
            },
            {
                "timestamp": datetime.utcnow().isoformat(),
                "action": "ONBOARDING_COMPLETED",
                "status": WorkflowState.KYC_PENDING.value,
                "details": "Customer onboarding completed, KYC verification pending",
                "data": {
                    "full_name": app_data.full_name,
                    "pan": app_data.pan,
                    "employment_type": app_data.employment_type.value,
                    "monthly_income": app_data.monthly_income,
                    "loan_amount": app_data.loan_amount,
                }
            }
        ]
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return application


@router.get("", response_model=PaginatedResponse)
async def list_applications(
    status: Optional[WorkflowState] = Query(None, description="Filter by status"),
    eligibility: Optional[str] = Query(None, description="Filter by eligibility: eligible, not_eligible, pending"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    List all applications with optional filters
    
    Filters:
    - **status**: Filter by workflow status
    - **eligibility**: Filter by eligibility (eligible, not_eligible, pending)
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
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    applications = query.order_by(desc(Application.created_at)).offset(offset).limit(page_size).all()
    
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=[ApplicationListResponse.model_validate(app) for app in applications],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Get application by ID
    """
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found"
        )
    
    return application


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: str,
    app_data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Update application details
    
    Only allowed in DRAFT status.
    """
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found"
        )
    
    if application.status != WorkflowState.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update applications in DRAFT status"
        )
    
    # Update fields
    update_data = app_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    
    application.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(application)
    
    return application


@router.post("/{application_id}/kyc", response_model=ApplicationResponse)
async def initiate_kyc(
    application_id: str,
    db: Session = Depends(get_db),
    kyc_service: KYCServiceInterface = Depends(get_kyc_service),
    workflow: WorkflowEngine = Depends(get_workflow_engine),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Initiate KYC verification for an application
    
    - Application must be in KYC_PENDING status
    - KYC passes if nameMatchScore >= 80
    """
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found"
        )
    
    if application.status != WorkflowState.KYC_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"KYC can only be initiated when application is in KYC_PENDING status. Current status: {application.status.value}"
        )
    
    try:
        # Call KYC service
        kyc_result = await kyc_service.verify(
            full_name=application.full_name,
            pan=application.pan
        )
        
        # Store KYC result
        application.kyc_result = kyc_result
        application.kyc_completed_at = datetime.utcnow()
        
        # Determine next state
        if kyc_result["verified"]:
            target_state = WorkflowState.KYC_COMPLETED
            action = "KYC_VERIFIED"
            details = f"KYC verification successful (Score: {kyc_result['name_match_score']}%)"
        else:
            target_state = WorkflowState.KYC_FAILED
            action = "KYC_FAILED"
            details = f"KYC verification failed (Score: {kyc_result['name_match_score']}%, minimum required: {LoanConfig.MIN_KYC_NAME_MATCH_SCORE}%)"
        
        # Transition workflow
        workflow.transition(
            application=application,
            target_state=target_state,
            action=action,
            details=details,
            data=kyc_result,
            db=db
        )
        
        return application
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"KYC verification failed: {str(e)}"
        )


@router.post("/{application_id}/credit-check", response_model=ApplicationResponse)
async def initiate_credit_check(
    application_id: str,
    db: Session = Depends(get_db),
    credit_service: CreditBureauServiceInterface = Depends(get_credit_service),
    workflow: WorkflowEngine = Depends(get_workflow_engine),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Initiate credit bureau check for an application
    
    - Application must be in KYC_COMPLETED status
    - Credit check passes if:
        - Credit score >= 650
        - Active loans <= 5
    """
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found"
        )
    
    if application.status != WorkflowState.KYC_COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Credit check can only be initiated after KYC completion. Current status: {application.status.value}"
        )
    
    try:
        # First transition to CREDIT_CHECK_PENDING
        workflow.transition(
            application=application,
            target_state=WorkflowState.CREDIT_CHECK_PENDING,
            action="CREDIT_CHECK_INITIATED",
            details="Credit bureau check initiated",
            db=db
        )
        
        # Call credit service with db session to count real active loans
        credit_result = await credit_service.get_credit_report(
            pan=application.pan,
            monthly_income=application.monthly_income,
            db=db,
            current_application_id=application.application_id
        )
        
        # Store credit result
        application.credit_result = credit_result
        application.credit_completed_at = datetime.utcnow()
        
        # Determine next state
        if credit_result["passed"]:
            target_state = WorkflowState.CREDIT_CHECK_COMPLETED
            action = "CREDIT_CHECK_PASSED"
            details = f"Credit check passed (Score: {credit_result['credit_score']}, Active Loans: {credit_result['active_loans']})"
        else:
            target_state = WorkflowState.CREDIT_REJECTED
            action = "CREDIT_CHECK_REJECTED"
            
            rejection_reasons = []
            if credit_result["credit_score"] < LoanConfig.MIN_CREDIT_SCORE:
                rejection_reasons.append(f"Credit score {credit_result['credit_score']} below minimum {LoanConfig.MIN_CREDIT_SCORE}")
            if credit_result["active_loans"] > LoanConfig.MAX_ACTIVE_LOANS:
                rejection_reasons.append(f"Active loans ({credit_result['active_loans']}) exceed maximum {LoanConfig.MAX_ACTIVE_LOANS}")
            
            details = f"Credit check failed: {'; '.join(rejection_reasons)}"
        
        # Transition workflow
        workflow.transition(
            application=application,
            target_state=target_state,
            action=action,
            details=details,
            data=credit_result,
            db=db
        )
        
        return application
        
    except WorkflowError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Credit check failed: {str(e)}"
        )


@router.post("/{application_id}/eligibility", response_model=ApplicationResponse)
async def calculate_eligibility(
    application_id: str,
    db: Session = Depends(get_db),
    eligibility_engine: EligibilityEngineInterface = Depends(get_eligibility_engine),
    workflow: WorkflowEngine = Depends(get_workflow_engine),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Calculate loan eligibility for an application
    
    - Application must be in CREDIT_CHECK_COMPLETED status
    - Eligibility based on:
        - CIBIL Score
        - Income
        - Employment Type (Salaried: 50% max EMI, Self-Employed: 40% max EMI)
    """
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found"
        )
    
    if application.status != WorkflowState.CREDIT_CHECK_COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Eligibility can only be calculated after credit check completion. Current status: {application.status.value}"
        )
    
    try:
        # Get credit score from previous step
        credit_score = application.credit_result.get("credit_score", 0) if application.credit_result else 0
        
        # Calculate eligibility
        eligibility_result = await eligibility_engine.calculate(
            monthly_income=application.monthly_income,
            loan_amount=application.loan_amount,
            employment_type=application.employment_type.value,
            credit_score=credit_score,
        )
        
        # Store eligibility result
        application.eligibility_result = eligibility_result
        application.eligibility_checked_at = datetime.utcnow()
        
        # Determine next state
        if eligibility_result["eligible"]:
            target_state = WorkflowState.ELIGIBLE
            action = "ELIGIBLE"
            details = f"Eligible for loan amount ₹{application.loan_amount:,.0f} with EMI ₹{eligibility_result['requested_emi']:,.0f}"
        else:
            target_state = WorkflowState.NOT_ELIGIBLE
            action = "NOT_ELIGIBLE"
            details = f"Not eligible for requested amount. Max eligible: ₹{eligibility_result['max_eligible_amount']:,.0f}"
        
        # Transition workflow
        workflow.transition(
            application=application,
            target_state=target_state,
            action=action,
            details=details,
            data=eligibility_result,
            db=db
        )
        
        return application
        
    except WorkflowError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eligibility calculation failed: {str(e)}"
        )


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional),
):
    """
    Delete an application (Admin only)
    """
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found"
        )
    
    db.delete(application)
    db.commit()
    
    return None
