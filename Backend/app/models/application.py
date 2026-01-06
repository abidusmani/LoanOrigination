"""
Application Model
Database model for loan applications
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, JSON, Enum
from sqlalchemy.sql import func
from app.db.database import Base
from app.core.constants import WorkflowState, EmploymentType


class Application(Base):
    """Loan application model"""
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Workflow status
    status = Column(
        Enum(WorkflowState),
        default=WorkflowState.DRAFT,
        nullable=False,
        index=True
    )
    
    # Personal Details
    full_name = Column(String(255), nullable=True)
    mobile = Column(String(15), nullable=True)
    pan = Column(String(10), nullable=True, index=True)
    dob = Column(Date, nullable=True)
    
    # Employment & Income
    employment_type = Column(Enum(EmploymentType), nullable=True)
    monthly_income = Column(Float, nullable=True)
    
    # Loan Details
    loan_amount = Column(Float, nullable=True)
    
    # KYC Results (stored as JSON)
    kyc_result = Column(JSON, nullable=True)
    kyc_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Credit Check Results (stored as JSON)
    credit_result = Column(JSON, nullable=True)
    credit_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Eligibility Results (stored as JSON)
    eligibility_result = Column(JSON, nullable=True)
    eligibility_checked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Journey Log (stored as JSON array)
    journey_log = Column(JSON, default=list)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    def __repr__(self):
        return f"<Application(id={self.application_id}, status={self.status}, name={self.full_name})>"
    
    def add_journey_log(self, action: str, status: str, details: str, data: dict = None):
        """Add entry to journey log"""
        log_entry = {
            "timestamp": func.now(),
            "action": action,
            "status": status,
            "details": details,
            "data": data or {}
        }
        if self.journey_log is None:
            self.journey_log = []
        self.journey_log = self.journey_log + [log_entry]
