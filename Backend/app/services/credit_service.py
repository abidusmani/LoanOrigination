"""
Credit Bureau Service
Handles credit check with rule-based mock CIBIL implementation
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime
import uuid

from app.core.constants import LoanConfig


class CreditBureauServiceInterface(ABC):
    """Abstract Credit Bureau Service Interface"""
    
    @abstractmethod
    async def get_credit_report(self, pan: str, monthly_income: float = 0) -> Dict[str, Any]:
        """
        Get credit report for an applicant
        
        Args:
            pan: PAN number
            monthly_income: Monthly income (optional, for score adjustment)
            
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
    
    def _calculate_active_loans(self, pan: str) -> int:
        """
        Calculate number of active loans based on PAN
        
        Args:
            pan: PAN number
            
        Returns:
            Number of active loans
        """
        # Extract digits from PAN
        digits = ''.join(filter(str.isdigit, pan)) or '0000'
        sum_digits = sum(int(d) for d in digits)
        
        # Normalize to 0-8 range
        active_loans = sum_digits % 9
        
        # Test cases
        if '9999' in pan:
            active_loans = 7
        if '1111' in pan:
            active_loans = 1
        
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
    
    async def get_credit_report(self, pan: str, monthly_income: float = 0) -> Dict[str, Any]:
        """
        Get credit report using rule-based logic
        
        Args:
            pan: PAN number
            monthly_income: Monthly income
            
        Returns:
            Credit report result
        """
        if not pan:
            raise ValueError("PAN number is required for credit check")
        
        # Calculate credit score and active loans
        credit_score = self._calculate_credit_score(pan, monthly_income)
        active_loans = self._calculate_active_loans(pan)
        
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
                "verification_method": "Rule-Based Mock Service",
                "rules": {
                    "pan_pattern": pan[:5] if len(pan) >= 5 else pan,
                    "income_considered": monthly_income > 0,
                    "score_factors": {
                        "pan_first_char": pan[0].upper() if pan else '',
                        "pan_check_digit": pan[8] if len(pan) >= 9 else '',
                    }
                }
            }
        }


# Default credit service instance
credit_service = MockCibilService()


async def get_credit_service() -> CreditBureauServiceInterface:
    """Dependency to get credit service"""
    return credit_service
