"""
Pydantic Schemas for Application
Request/Response models for loan applications
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import date, datetime
from app.core.constants import WorkflowState, EmploymentType, LoanConfig
import re


class ApplicationBase(BaseModel):
    """Base application schema"""
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    pan: Optional[str] = None
    dob: Optional[date] = None
    employment_type: Optional[EmploymentType] = None
    monthly_income: Optional[float] = None
    loan_amount: Optional[float] = None


class ApplicationCreate(ApplicationBase):
    """Schema for creating a new application (onboarding)"""
    full_name: str = Field(..., min_length=2, max_length=255)
    mobile: str = Field(..., min_length=10, max_length=10)
    pan: str = Field(..., min_length=10, max_length=10)
    dob: date
    employment_type: EmploymentType
    monthly_income: float = Field(..., gt=0)
    loan_amount: float = Field(..., gt=0)

    @field_validator('pan')
    @classmethod
    def validate_pan(cls, v: str) -> str:
        """Validate PAN format: ABCDE1234F"""
        pan_pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
        if not re.match(pan_pattern, v.upper()):
            raise ValueError('Invalid PAN format. Expected format: ABCDE1234F')
        return v.upper()

    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        """Validate mobile number: 10 digits starting with 6-9"""
        mobile_pattern = r'^[6-9]\d{9}$'
        if not re.match(mobile_pattern, v):
            raise ValueError('Invalid mobile number. Must be 10 digits starting with 6-9')
        return v

    @field_validator('dob')
    @classmethod
    def validate_age(cls, v: date) -> date:
        """Validate age >= 21"""
        from datetime import date as date_cls
        today = date_cls.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < LoanConfig.MIN_AGE:
            raise ValueError(f'Applicant must be at least {LoanConfig.MIN_AGE} years old')
        return v

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Validate full name contains only letters and spaces"""
        if not re.match(r'^[a-zA-Z\s]+$', v.strip()):
            raise ValueError('Full name must contain only letters and spaces')
        return v.strip()


class ApplicationUpdate(ApplicationBase):
    """Schema for updating an application"""
    pass


class JourneyLogEntry(BaseModel):
    """Journey log entry schema"""
    timestamp: datetime
    action: str
    status: str
    details: str
    data: Optional[dict] = None


class KYCResult(BaseModel):
    """KYC verification result schema"""
    verified: bool
    name_match_score: int
    verification_id: str
    verified_at: datetime
    details: dict


class CreditResult(BaseModel):
    """Credit check result schema"""
    passed: bool
    credit_score: int
    active_loans: int
    bureau_id: str
    checked_at: datetime
    details: dict


class EligibilityResult(BaseModel):
    """Eligibility calculation result schema"""
    eligible: bool
    requested_loan_amount: float
    approved_loan_amount: float
    max_eligible_amount: float
    requested_emi: float
    max_allowed_emi: float
    interest_rate: float
    tenure: int
    credit_score: int
    monthly_income: float
    employment_type: str
    total_payable: float
    total_interest: float
    calculated_at: datetime
    reason: str


class ApplicationResponse(ApplicationBase):
    """Schema for application response"""
    id: int
    application_id: str
    status: WorkflowState
    kyc_result: Optional[dict] = None
    kyc_completed_at: Optional[datetime] = None
    credit_result: Optional[dict] = None
    credit_completed_at: Optional[datetime] = None
    eligibility_result: Optional[dict] = None
    eligibility_checked_at: Optional[datetime] = None
    journey_log: List[dict] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    """Schema for listing applications"""
    id: int
    application_id: str
    status: WorkflowState
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    loan_amount: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationFilters(BaseModel):
    """Filters for listing applications"""
    status: Optional[WorkflowState] = None
    eligibility: Optional[str] = None  # 'eligible', 'not_eligible', 'pending'
    page: int = 1
    page_size: int = 10


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
