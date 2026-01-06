"""
Workflow States Enum
Defines all possible states in the loan application workflow
"""

from enum import Enum


class WorkflowState(str, Enum):
    """Loan application workflow states"""
    DRAFT = "DRAFT"
    KYC_PENDING = "KYC_PENDING"
    KYC_COMPLETED = "KYC_COMPLETED"
    KYC_FAILED = "KYC_FAILED"
    CREDIT_CHECK_PENDING = "CREDIT_CHECK_PENDING"
    CREDIT_CHECK_COMPLETED = "CREDIT_CHECK_COMPLETED"
    CREDIT_REJECTED = "CREDIT_REJECTED"
    ELIGIBLE = "ELIGIBLE"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"


class EmploymentType(str, Enum):
    """Employment type options"""
    SALARIED = "SALARIED"
    SELF_EMPLOYED = "SELF_EMPLOYED"


# Workflow transition rules
VALID_TRANSITIONS = {
    WorkflowState.DRAFT: [WorkflowState.KYC_PENDING],
    WorkflowState.KYC_PENDING: [WorkflowState.KYC_COMPLETED, WorkflowState.KYC_FAILED],
    WorkflowState.KYC_COMPLETED: [WorkflowState.CREDIT_CHECK_PENDING],
    WorkflowState.KYC_FAILED: [],  # Terminal state
    WorkflowState.CREDIT_CHECK_PENDING: [WorkflowState.CREDIT_CHECK_COMPLETED, WorkflowState.CREDIT_REJECTED],
    WorkflowState.CREDIT_CHECK_COMPLETED: [WorkflowState.ELIGIBLE, WorkflowState.NOT_ELIGIBLE],
    WorkflowState.CREDIT_REJECTED: [],  # Terminal state
    WorkflowState.ELIGIBLE: [],  # Terminal state
    WorkflowState.NOT_ELIGIBLE: [],  # Terminal state
}

# Terminal states that cannot transition further
TERMINAL_STATES = [
    WorkflowState.KYC_FAILED,
    WorkflowState.CREDIT_REJECTED,
    WorkflowState.ELIGIBLE,
    WorkflowState.NOT_ELIGIBLE,
]

# Loan configuration constants
class LoanConfig:
    """Loan configuration constants"""
    MIN_AGE = 21
    MAX_LOAN_MULTIPLIER = 20  # Max loan = 20x monthly income
    INTEREST_RATE = 12.0  # 12% per annum
    TENURE_MONTHS = 36
    SALARIED_MAX_EMI_PERCENT = 50
    SELF_EMPLOYED_MAX_EMI_PERCENT = 40
    MIN_CREDIT_SCORE = 650
    MAX_ACTIVE_LOANS = 5
    MIN_KYC_NAME_MATCH_SCORE = 80
