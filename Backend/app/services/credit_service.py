"""
Credit Bureau Service
Handles credit check with rule-based mock CIBIL implementation
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

from sqlalchemy.orm import Session

from app.core.constants import LoanConfig, WorkflowState


class CreditBureauServiceInterface(ABC):
    """Abstract Credit Bureau Service Interface"""
    
    @abstractmethod
    async def get_credit_report(self, pan: str, monthly_income: float = 0, db: Optional[Session] = None, current_application_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get credit report for an applicant
        
        Args:
            pan: PAN number
            monthly_income: Monthly income (optional, for score adjustment)
            db: Database session (optional, for counting real active loans)
            current_application_id: Current application ID to exclude from count
            
        Returns:
            Credit report result
        """
        pass


class MockCibilService(CreditBureauServiceInterface):
    """
    Mock CIBIL Service Implementation
    Uses rule-based logic for credit check
    
    Rules:
    - Credit score < 650 → CREDIT_REJECTED
    - Active loans > 5 → CREDIT_REJECTED
    """
    
    def _calculate_credit_score(self, pan: str, monthly_income: float = 0) -> int:
        """
        Calculate credit score based on PAN pattern and income
        
        Args:
            pan: PAN number
            monthly_income: Monthly income
            
        Returns:
            Credit score (300-900)
        """
        base_score = 700
        
        # Rule 1: PAN first letter affects base score
        first_char = pan[0].upper() if pan else ''
        if first_char in 'ABCD':
            base_score += 50
        elif first_char in 'WXYZ':
            base_score -= 100
        
        # Rule 2: Income-based adjustment
        if monthly_income >= 100000:
            base_score += 30
        elif monthly_income >= 50000:
            base_score += 15
        elif monthly_income < 25000 and monthly_income > 0:
            base_score -= 50
        
        # Rule 3: PAN checksum digit (9th character)
        if len(pan) >= 9:
            check_digit = pan[8]
            if check_digit.isdigit():
                digit = int(check_digit)
                if digit >= 5:
                    base_score += 20
                elif digit <= 2:
                    base_score -= 30
        
        # Rule 4: Test cases
        if pan.upper().startswith('FAIL') or '0000' in pan:
            base_score = 550  # Force low score
        
        if pan.upper().startswith('PASS') or pan.upper().startswith('GOOD'):
            base_score = 780  # Force high score
        
        return max(300, min(900, base_score))
    
    def _count_active_loans_from_db(self, pan: str, db: Optional[Session], current_application_id: Optional[str] = None) -> int:
        """
        Count actual active/approved loans for this PAN from database
        
        Args:
            pan: PAN number
            db: Database session
            current_application_id: Current application ID to exclude
            
        Returns:
            Number of active loans
        """
        if not db:
            return 0
        
        # Import here to avoid circular imports
        from app.models.application import Application
        
        # Count applications with ELIGIBLE status (approved loans) for this PAN
        query = db.query(Application).filter(
            Application.pan == pan,
            Application.status == WorkflowState.ELIGIBLE
        )
        
        # Exclude current application if provided
        if current_application_id:
            query = query.filter(Application.application_id != current_application_id)
        
        active_loans = query.count()
        
        return active_loans
    
    def _get_credit_history(self, score: int) -> str:
        """Get credit history rating based on score"""
        if score >= 750:
            return "Excellent"
        elif score >= 700:
            return "Good"
        elif score >= 650:
            return "Fair"
        elif score >= 550:
            return "Poor"
        return "Very Poor"
    
    async def get_credit_report(self, pan: str, monthly_income: float = 0, db: Optional[Session] = None, current_application_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get credit report using rule-based logic
        
        Args:
            pan: PAN number
            monthly_income: Monthly income
            db: Database session for counting real active loans
            current_application_id: Current application to exclude from count
            
        Returns:
            Credit report result
        """
        if not pan:
            raise ValueError("PAN number is required for credit check")
        
        # Calculate credit score
        credit_score = self._calculate_credit_score(pan, monthly_income)
        
        # Count REAL active loans from database
        active_loans = self._count_active_loans_from_db(pan, db, current_application_id)
        
        # Determine if credit check passed
        passed = (credit_score >= LoanConfig.MIN_CREDIT_SCORE and 
                  active_loans <= LoanConfig.MAX_ACTIVE_LOANS)
        
        return {
            "passed": passed,
            "credit_score": credit_score,
            "active_loans": active_loans,
            "bureau_id": f"CIBIL-{uuid.uuid4().hex[:12].upper()}",
            "checked_at": datetime.utcnow().isoformat(),
            "details": {
                "credit_history": self._get_credit_history(credit_score),
                "payment_history": "Minor Delays" if active_loans > 3 else "No defaults",
                "credit_utilization": f"{min(90, 20 + active_loans * 10)}%",
                "oldest_account": f"{max(1, 10 - active_loans)} years",
                "recent_enquiries": min(active_loans, 4),
                "total_accounts": active_loans + 3,
                "closed_accounts": max(0, active_loans - 2),
                "verification_method": "Database + Rule-Based Service",
                "data_source": "Real loan count from database"
            }
        }


# Default credit service instance
credit_service = MockCibilService()


async def get_credit_service() -> CreditBureauServiceInterface:
    """Dependency to get credit service"""
    return credit_service
